import type { Automation, Position, Score, Track } from '@liminal/score'
import { scoreLengthTicks, tickToPosition, validate } from '@liminal/score'
import type { AutomationTargetKind, DowngradedCurve, Move, Ramped } from './automation.ts'
import { planAutomation, refuseOutOfRange } from './automation.ts'
import type { Effect } from './effects.ts'
import { createEffect } from './effects.ts'
import { EngineError } from './errors.ts'
import type { NodeLedger } from './graph.ts'
import { createLedger } from './graph.ts'
import { createVoice, scoreReleaseTailSeconds } from './instruments.ts'
import { barSeconds, scoreSeconds, secondsToTicks, ticksToSeconds } from './time.ts'
import type { EngineContext, Tone, ToneContext, ToneNode } from './tone.ts'
import { loadTone, rawContextOf, rendersOffline, wrapContext } from './tone.ts'

export const DEFAULT_LOOK_AHEAD_SECONDS = 0.2

const ENGINES_BY_CONTEXT = new WeakSet<BaseAudioContext>()

export type EngineEvent = 'bar' | 'stopped' | 'ended'

export type BarEvent = { bar: number; time: number }

export type EnginePayload = { bar: BarEvent; ended: BarEvent; stopped: undefined }

export type Engine = {
  play: () => void
  stop: () => void
  dispose: () => void
  position: () => Position
  on: <E extends EngineEvent>(event: E, listener: (payload: EnginePayload[E]) => void) => () => void
  pendingNodeCount: () => number
  disposedNodeCount: () => number
  triggeredNoteCount: () => number
  releaseTailSeconds: () => number
  lookAhead: () => number
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
  filter?: Effect
  trigger: (pitch: number, duration: number, time: number, velocity: number) => void
}

export async function createEngine(options: EngineOptions): Promise<Engine> {
  const key = rawContextOf(options.context)
  if (ENGINES_BY_CONTEXT.has(key)) {
    throw new EngineError(
      'context-in-use',
      'this context already drives an engine, and one transport cannot serve two',
    )
  }
  const tone = await loadTone()
  const { context, owned } = wrapContext(tone, options.context)
  const release = () => {
    ENGINES_BY_CONTEXT.delete(key)
    if (owned) {
      context.clockSource = 'offline'
    }
  }
  ENGINES_BY_CONTEXT.add(key)
  const ledger = createLedger()
  try {
    return await buildEngine(options, { tone, context, ledger, release })
  } catch (failure) {
    try {
      ledger.disposeAll()
    } catch (whileCleaningUp) {
      release()
      throw new AggregateError(
        [failure, whileCleaningUp],
        'the engine failed to build, and cleaning up after it failed too',
      )
    }
    release()
    throw failure
  }
}

type Built = { tone: Tone; context: ToneContext; ledger: NodeLedger; release: () => void }

async function buildEngine(options: EngineOptions, built: Built): Promise<Engine> {
  const { tone, context, ledger, release } = built
  const { context: raw, score } = options
  const problems = validate(score)
  if (problems.errors.length > 0) {
    const first = problems.errors[0]
    throw new EngineError('invalid-score', `the score is not playable: ${first?.message ?? ''}`, {
      code: first?.code ?? 'unknown',
    })
  }
  const offline = rendersOffline(raw)
  const lookAheadSeconds = options.lookAheadSeconds ?? DEFAULT_LOOK_AHEAD_SECONDS
  if (!offline) {
    context.lookAhead = lookAheadSeconds
  }
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
  const staticValues = new Map<string, number>()
  const moves: { param: Ramped; move: Move }[] = []
  const lengthTicks = scoreLengthTicks(score)
  for (const automation of score.automation) {
    for (const point of automation.points) {
      refuseOutOfRange(automation, point, lengthTicks)
    }
    const { param, kind } = resolveTarget(automation, chains, master)
    automated.set(automation.id, param)
    const staticValue = param.value
    staticValues.set(automation.id, staticValue)
    for (const move of planAutomation(
      automation,
      staticValue,
      kind,
      automation.points.map((point) => ({
        point,
        seconds: ticksToSeconds(point.at, score.tempo.bpm),
      })),
      downgraded,
    )) {
      moves.push({ param, move })
    }
  }

  const releaseTailSeconds = scoreReleaseTailSeconds(score)
  let state: 'idle' | 'playing' | 'ringing' = 'idle'
  let triggered = 0
  let disposed = false
  const listeners = new Map<EngineEvent, Set<(payload: never) => void>>()
  const emit = (event: EngineEvent, payload?: BarEvent) => {
    for (const listener of listeners.get(event) ?? []) {
      ;(listener as (given: BarEvent | undefined) => void)(payload)
    }
  }

  const parts = score.clips.map((clip) => {
    const chain = chains.get(clip.trackId)
    if (chain === undefined) {
      throw new EngineError(
        'automation-target-missing',
        `clip ${clip.id} names track ${clip.trackId}, which the engine did not build`,
        { clip: clip.id, track: clip.trackId },
      )
    }
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
          if (state !== 'playing') {
            return
          }
          triggered += 1
          chain.trigger(event.pitch, event.duration, time, event.velocity)
        },
        events,
      }),
    )
    part.start(0)
    return part
  })

  const perBar = barSeconds(score)
  const totalSeconds = scoreSeconds(score)
  const scheduled: number[] = []

  scheduled.push(
    transport.scheduleRepeat(
      (time) => {
        if (state !== 'playing') {
          return
        }
        const bar = Math.max(0, Math.round(transport.getSecondsAtTime(time) / perBar))
        if (bar * perBar < totalSeconds) {
          emit('bar', { bar, time })
        }
      },
      perBar,
      0,
    ),
  )

  for (const { param, move } of moves) {
    scheduled.push(
      transport.schedule((time) => {
        if (state === 'playing') {
          move.apply(param, time)
        }
      }, move.atTransportSeconds),
    )
  }

  const restoreStaticValues = () => {
    const now = Math.max(context.now(), 0)
    for (const [id, param] of automated) {
      param.cancelScheduledValues(now)
      param.setValueAtTime(staticValues.get(id) ?? param.value, now)
    }
  }

  const rewind = () => {
    transport.stop(0)
    transport.seconds = 0
    restoreStaticValues()
  }

  let tailId: number | undefined
  const cancelTail = () => {
    if (tailId !== undefined) {
      context.clearTimeout(tailId)
      tailId = undefined
    }
  }

  let endId: number | undefined
  const armEnd = () => {
    endId = transport.scheduleOnce((time) => {
      endId = undefined
      if (state !== 'playing') {
        return
      }
      state = 'ringing'
      emit('ended', { bar: Math.round(totalSeconds / perBar), time })
      tailId = context.setTimeout(() => {
        tailId = undefined
        if (state !== 'ringing') {
          return
        }
        state = 'idle'
        rewind()
      }, releaseTailSeconds)
    }, totalSeconds)
  }
  armEnd()

  return {
    play: () => {
      if (disposed || state === 'playing') {
        return
      }
      if (state === 'ringing') {
        cancelTail()
        rewind()
      }
      state = 'playing'
      if (endId === undefined) {
        armEnd()
      }
      if (offline) {
        transport.start(0)
      } else {
        transport.start()
      }
    },
    stop: () => {
      if (disposed || state === 'idle') {
        return
      }
      state = 'idle'
      cancelTail()
      rewind()
      emit('stopped')
    },
    dispose: () => {
      if (disposed) {
        return
      }
      disposed = true
      state = 'idle'
      cancelTail()
      transport.stop(0)
      for (const id of scheduled) {
        transport.clear(id)
      }
      if (endId !== undefined) {
        transport.clear(endId)
      }
      for (const part of parts) {
        part.stop(0)
      }
      try {
        ledger.disposeAll()
      } finally {
        listeners.clear()
        release()
      }
    },
    position: () => {
      const seconds = Math.min(transport.seconds, totalSeconds)
      return tickToPosition(
        Math.min(secondsToTicks(seconds, score.tempo.bpm), Math.max(0, lengthTicks - 1)),
        score.meter,
      )
    },
    on: (event, listener) => {
      const set = listeners.get(event) ?? new Set()
      const stored = listener as (payload: never) => void
      set.add(stored)
      listeners.set(event, set)
      return () => {
        set.delete(stored)
      }
    },
    pendingNodeCount: () => ledger.pending(),
    disposedNodeCount: () => ledger.disposed(),
    triggeredNoteCount: () => triggered,
    releaseTailSeconds: () => releaseTailSeconds,
    lookAhead: () => (offline ? 0 : context.lookAhead),
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
  ledger: NodeLedger,
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
    gain,
    panner,
    ...(filter === undefined ? {} : { filter }),
    trigger: voice.trigger,
  }
}

function resolveTarget(
  automation: Automation,
  chains: Map<string, Chain>,
  master: { gain: Ramped },
): { param: Ramped; kind: AutomationTargetKind } {
  const target = automation.target
  if (!('trackId' in target)) {
    return { param: master.gain, kind: 'signed' }
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
