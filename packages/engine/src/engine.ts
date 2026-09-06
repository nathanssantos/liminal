import type { Automation, Position, Score, Track } from '@liminal/score'
import { scoreLengthTicks, tickToPosition, validate } from '@liminal/score'
import type { AutomationTargetKind, DowngradedCurve, Ramped } from './automation.ts'
import { refuseOutOfRange, scheduleAutomation } from './automation.ts'
import { createEffect } from './effects.ts'
import { EngineError } from './errors.ts'
import { createLedger } from './graph.ts'
import { createVoice } from './instruments.ts'
import { barSeconds, scoreSeconds, secondsToTicks, ticksToSeconds } from './time.ts'
import type { EngineContext, Tone, ToneContext, ToneNode } from './tone.ts'
import { loadTone, rendersOffline, wrapContext } from './tone.ts'

export const DEFAULT_LOOK_AHEAD_SECONDS = 0.2

export type EngineEvent = 'bar' | 'stopped' | 'ended'

export type BarEvent = { bar: number; time: number }

export type Engine = {
  play: () => void
  stop: () => void
  dispose: () => void
  position: () => Position
  on: (event: EngineEvent, listener: (payload: BarEvent | undefined) => void) => () => void
  pendingNodeCount: () => number
  downgradedCurves: () => readonly DowngradedCurve[]
  automationValueAt: (automationId: string, seconds: number) => number
}

export type EngineOptions = {
  context: EngineContext
  score: Score
  lookAheadSeconds?: number
}

type Chain = {
  gain: { gain: Ramped }
  panner: { pan: Ramped }
  filter?: { cutoff?: Ramped; quality?: Ramped }
  trigger: (pitch: number, duration: number, time: number, velocity: number) => void
}

export async function createEngine(options: EngineOptions): Promise<Engine> {
  const { context: raw, score } = options
  const problems = validate(score)
  if (problems.errors.length > 0) {
    const first = problems.errors[0]
    throw new EngineError('invalid-score', `the score is not playable: ${first?.message ?? ''}`, {
      code: first?.code ?? 'unknown',
    })
  }
  const tone = await loadTone()
  const context = wrapContext(tone, raw)
  const offline = rendersOffline(raw)
  const ledger = createLedger()
  const transport = context.transport
  transport.bpm.value = score.tempo.bpm

  const master = ledger.add(
    new tone.Gain({ context, gain: score.mix.master.gainDb, units: 'decibels' }),
  )
  if (score.mix.master.limiter) {
    const limiter = ledger.add(new tone.Limiter({ context, threshold: -1 }))
    master.connect(limiter)
    limiter.toDestination()
  } else {
    master.toDestination()
  }

  const chains = new Map<string, Chain>()
  for (const track of score.tracks) {
    chains.set(track.id, buildChain(tone, context, ledger, track, master))
  }

  const downgraded: DowngradedCurve[] = []
  const automated = new Map<string, Ramped>()
  const lengthTicks = scoreLengthTicks(score)
  for (const automation of score.automation) {
    for (const point of automation.points) {
      refuseOutOfRange(automation, point, lengthTicks)
    }
    const { param, kind } = resolveTarget(automation, chains, master)
    automated.set(automation.id, param)
    scheduleAutomation(
      automation,
      param,
      kind,
      automation.points.map((point) => ({
        point,
        seconds: ticksToSeconds(point.at, score.tempo.bpm),
      })),
      downgraded,
    )
  }

  let runId = 0
  let playing = false
  const listeners = new Map<EngineEvent, Set<(payload: BarEvent | undefined) => void>>()
  const emit = (event: EngineEvent, payload?: BarEvent) => {
    for (const listener of listeners.get(event) ?? []) {
      listener(payload)
    }
  }

  const parts = score.clips.map((clip) => {
    const chain = chains.get(clip.trackId)
    const events = clip.notes.map((note) => ({
      time: ticksToSeconds(clip.start + note.at, score.tempo.bpm),
      pitch: note.pitch,
      duration: ticksToSeconds(note.duration, score.tempo.bpm),
      velocity: note.velocity,
    }))
    const part = ledger.add(
      new tone.Part({
        context,
        callback: (time: number, event: (typeof events)[number]) => {
          chain?.trigger(event.pitch, event.duration, time, event.velocity)
        },
        events,
      }),
    )
    part.start(0)
    return part
  })

  const perBar = barSeconds(score)
  const totalSeconds = scoreSeconds(score)
  const barId = transport.scheduleRepeat(
    (time) => {
      const mine = runId
      const bar = Math.round(time / perBar)
      if (mine === runId && playing && bar * perBar < totalSeconds) {
        emit('bar', { bar, time })
      }
    },
    perBar,
    0,
  )
  const endId = transport.scheduleOnce((time) => {
    if (!playing) {
      return
    }
    playing = false
    emit('ended', { bar: Math.round(time / perBar), time })
    transport.stop(time)
  }, totalSeconds)

  return {
    play: () => {
      if (playing) {
        return
      }
      playing = true
      runId += 1
      if (offline) {
        transport.start(0)
      } else {
        transport.start()
      }
    },
    stop: () => {
      if (!playing) {
        return
      }
      playing = false
      runId += 1
      transport.stop(0)
      transport.seconds = 0
      emit('stopped')
    },
    dispose: () => {
      playing = false
      runId += 1
      transport.clear(barId)
      transport.clear(endId)
      transport.cancel(0)
      for (const part of parts) {
        part.stop(0)
      }
      ledger.disposeAll()
      listeners.clear()
    },
    position: () => {
      const seconds = Math.min(transport.seconds, totalSeconds)
      return tickToPosition(
        Math.min(secondsToTicks(seconds, score.tempo.bpm), lengthTicks),
        score.meter,
      )
    },
    on: (event, listener) => {
      const set = listeners.get(event) ?? new Set()
      set.add(listener)
      listeners.set(event, set)
      return () => {
        set.delete(listener)
      }
    },
    pendingNodeCount: () => ledger.pending(),
    downgradedCurves: () => downgraded,
    automationValueAt: (automationId, seconds) => {
      const param = automated.get(automationId)
      if (param === undefined) {
        throw new EngineError(
          'automation-target-missing',
          `the engine scheduled no automation with id ${automationId}`,
          { automation: automationId },
        )
      }
      return param.getValueAtTime(seconds)
    },
  }
}

function buildChain(
  tone: Tone,
  context: ToneContext,
  ledger: ReturnType<typeof createLedger>,
  track: Track,
  master: ToneNode,
): Chain {
  const voice = createVoice(tone, context, ledger, track.instrument)
  const gain = ledger.add(new tone.Gain({ context, gain: track.gainDb, units: 'decibels' }))
  const panner = ledger.add(new tone.Panner({ context, pan: track.pan }))
  const effects = track.fx.map((fx) => createEffect(tone, context, ledger, fx))
  let tail: ToneNode = voice.node
  for (const effect of effects) {
    tail.connect(effect.node)
    tail = effect.node
  }
  tail.connect(gain)
  gain.connect(panner)
  if (!track.muted) {
    panner.connect(master)
  }
  const filter = effects.find((effect) => effect.cutoff !== undefined)
  return {
    gain: gain as unknown as { gain: Ramped },
    panner: panner as unknown as { pan: Ramped },
    ...(filter === undefined
      ? {}
      : { filter: filter as unknown as { cutoff?: Ramped; quality?: Ramped } }),
    trigger: voice.trigger,
  }
}

function resolveTarget(
  automation: Automation,
  chains: Map<string, Chain>,
  master: unknown,
): { param: Ramped; kind: AutomationTargetKind } {
  const target = automation.target
  if (!('trackId' in target)) {
    return { param: (master as { gain: Ramped }).gain, kind: 'signed' }
  }
  const chain = chains.get(target.trackId)
  if (chain === undefined) {
    throw new EngineError(
      'automation-target-missing',
      `automation ${automation.id} names track ${target.trackId}, which the engine did not build`,
      { automation: automation.id, track: target.trackId },
    )
  }
  if (target.param === 'gainDb') {
    return { param: chain.gain.gain, kind: 'signed' }
  }
  if (target.param === 'pan') {
    return { param: chain.panner.pan, kind: 'signed' }
  }
  if (target.param === 'filter.cutoff' || target.param === 'filter.q') {
    const param = target.param === 'filter.cutoff' ? chain.filter?.cutoff : chain.filter?.quality
    if (param === undefined) {
      throw new EngineError(
        'automation-target-missing',
        `automation ${automation.id} drives ${target.param}, but track ${target.trackId} has no filter`,
        { automation: automation.id, track: target.trackId, param: target.param },
      )
    }
    return { param, kind: 'positive' }
  }
  throw new EngineError(
    'automation-target-missing',
    `automation ${automation.id} drives ${target.param}, which the engine does not expose in M1`,
    { automation: automation.id, param: target.param },
  )
}
