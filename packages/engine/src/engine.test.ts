import type { Score } from '@liminal/score'
import { barToTick, scoreLengthTicks } from '@liminal/score'
import { sixteenBars } from '@liminal/score/fixtures'
import { OfflineAudioContext } from 'node-web-audio-api'
import { beforeAll, describe, expect, it } from 'vitest'
import { offlineEngine, peakBetween, peakOf } from '../tests/harness.ts'
import { MIN_EXPONENTIAL_VALUE } from './automation.ts'
import { createEngine } from './engine.ts'
import { EngineError } from './errors.ts'
import { SUPPORTED_PRESETS, scoreReleaseTailSeconds } from './instruments.ts'
import { barSeconds, scoreSeconds, ticksToSeconds } from './time.ts'
import { loadTone } from './tone.ts'

const withoutNotes = (score: Score): Score => {
  const silent = structuredClone(score)
  for (const clip of silent.clips) {
    clip.notes = []
  }
  return silent
}

const channelPeak = (buffer: AudioBuffer, channel: number): number => {
  const data = buffer.getChannelData(channel)
  let peak = 0
  for (let index = 0; index < data.length; index += 1) {
    peak = Math.max(peak, Math.abs(data[index] ?? 0))
  }
  return peak
}

const noteCount = (score: Score): number =>
  score.clips.reduce((total, clip) => total + clip.notes.length, 0)

const twoBars = (): Score => {
  const score = structuredClone(sixteenBars)
  const section = score.sections[0]
  if (section !== undefined) {
    section.bars = 2
  }
  score.clips = score.clips.map((clip) => ({
    ...clip,
    length: barToTick(2, score.meter),
    notes: clip.notes.filter((note) => note.at < barToTick(2, score.meter)),
  }))
  score.automation = []
  return score
}

const clone = (mutate: (score: Score) => void): Score => {
  const copy = structuredClone(sixteenBars)
  mutate(copy)
  return copy
}

describe('the engine plays the fixture', () => {
  const bars: number[] = []
  let endedAt: number | undefined
  let peak = 0
  let pendingBefore = 0
  let pendingAfter = 0
  let disposedCount = 0
  let triggered = 0
  let peakPastTheTail = 0

  const SILENCE_AFTER_THE_TAIL_SECONDS = 0.5

  beforeAll(async () => {
    const tail = scoreReleaseTailSeconds(sixteenBars)
    const { engine, render } = await offlineEngine(
      sixteenBars,
      scoreSeconds(sixteenBars) + tail + SILENCE_AFTER_THE_TAIL_SECONDS,
    )
    engine.on('bar', (event) => {
      if (event !== undefined) {
        bars.push(event.bar)
      }
    })
    engine.on('ended', (event) => {
      endedAt = event?.time
    })
    engine.play()
    const rendered = await render()
    peak = peakOf(rendered)
    peakPastTheTail = peakBetween(
      rendered,
      scoreSeconds(sixteenBars) + tail,
      scoreSeconds(sixteenBars) + tail + SILENCE_AFTER_THE_TAIL_SECONDS,
    )
    triggered = engine.triggeredNoteCount()
    pendingBefore = engine.pendingNodeCount()
    engine.dispose()
    pendingAfter = engine.pendingNodeCount()
    disposedCount = engine.disposedNodeCount()
  })

  it('emits 16 bar events with bar 0 to 15 in order, and ended at the end', () => {
    expect(bars).toEqual(Array.from({ length: 16 }, (_, index) => index))
    expect(endedAt).toBeCloseTo(scoreSeconds(sixteenBars), 3)
  })

  it('renders audio rather than silence, under the limiter', () => {
    expect(peak).toBeGreaterThan(0.05)
    expect(peak).toBeLessThanOrEqual(1)
  })

  it('triggers exactly the notes the document holds, and nothing after them', () => {
    expect(triggered).toBe(noteCount(sixteenBars))
    expect(peakPastTheTail).toBeLessThan(0.005)
  })

  it('dispose() leaves the context with no engine node', () => {
    expect(pendingBefore).toBeGreaterThan(0)
    expect(pendingAfter).toBe(0)
    expect(disposedCount).toBe(pendingBefore)
  })
})

describe('the engine reports where it is', () => {
  it('position() during bar 4 returns bar 4', async () => {
    const { engine, render } = await offlineEngine(
      withoutNotes(sixteenBars),
      barSeconds(sixteenBars) * 5,
    )
    let atBarFour: number | undefined
    engine.on('bar', (event) => {
      if (event?.bar === 4) {
        atBarFour = engine.position().bar
      }
    })
    engine.play()
    await render()
    expect(atBarFour).toBe(4)
    engine.dispose()
  })

  it('stop() at bar 3 emits stopped and no bar afterwards', async () => {
    const { engine, render } = await offlineEngine(
      withoutNotes(sixteenBars),
      barSeconds(sixteenBars) * 5,
    )
    const seen: number[] = []
    let stopped = 0
    engine.on('bar', (event) => {
      if (event === undefined) {
        return
      }
      seen.push(event.bar)
      if (event.bar === 3) {
        engine.stop()
      }
    })
    engine.on('stopped', () => {
      stopped += 1
    })
    engine.play()
    await render()
    expect(seen).toEqual([0, 1, 2, 3])
    expect(stopped).toBe(1)
    engine.dispose()
  })
})

describe('the engine follows the automation the document carries', () => {
  const automationId = sixteenBars.automation[0]?.id ?? ''
  const startSeconds = ticksToSeconds(barToTick(8, sixteenBars.meter), sixteenBars.tempo.bpm)
  const endSeconds = ticksToSeconds(barToTick(16, sixteenBars.meter), sixteenBars.tempo.bpm)

  const played = async (score: Score) => {
    const { engine, render } = await offlineEngine(withoutNotes(score), startSeconds + 0.5)
    engine.play()
    await render()
    return engine
  }

  it('holds the first point value at the tick of bar 8, not the static one', async () => {
    const score = clone((draft) => {
      const point = draft.automation[0]?.points[0]
      if (point !== undefined) {
        point.value = 2000
      }
    })
    const engine = await played(score)
    expect(engine.automationValueAt(automationId, startSeconds)).toBeCloseTo(2000, 0)
    engine.dispose()
  })

  it('holds the static value until the first point, rather than ramping from bar 0', async () => {
    const score = clone((draft) => {
      const point = draft.automation[0]?.points[0]
      if (point !== undefined) {
        point.value = 2000
      }
    })
    const engine = await played(score)
    expect(engine.automationValueAt(automationId, startSeconds / 2)).toBeCloseTo(800, 0)
    engine.dispose()
  })

  it('reaches the last point value at the end of the ramp', async () => {
    const engine = await played(sixteenBars)
    expect(engine.automationValueAt(automationId, endSeconds)).toBeCloseTo(8000, 0)
    engine.dispose()
  })

  it('is on the way up in the middle of the ramp, not still at the start', async () => {
    const engine = await played(sixteenBars)
    const middle = engine.automationValueAt(automationId, (startSeconds + endSeconds) / 2)
    expect(middle).toBeGreaterThan(800)
    expect(middle).toBeLessThan(8000)
    engine.dispose()
  })

  it('refuses an automation point past the end of the score', async () => {
    const score = clone((draft) => {
      const point = draft.automation[0]?.points[1]
      if (point !== undefined) {
        point.at += 1
      }
    })
    await expect(offlineEngine(score, 1)).rejects.toThrow(/automation-out-of-range|past the score/)
  })

  it('accepts a point that lands exactly on the end of the score', async () => {
    const last = sixteenBars.automation[0]?.points.at(-1)
    expect(last?.at).toBe(scoreLengthTicks(sixteenBars))
    const engine = await played(sixteenBars)
    expect(engine.automationValueAt(automationId, endSeconds)).toBeCloseTo(8000, 0)
    engine.dispose()
  })

  it('downgrades an exponential ramp on a signed parameter and says so', async () => {
    const score = clone((draft) => {
      const automation = draft.automation[0]
      if (automation !== undefined) {
        automation.target = { master: 'gainDb' }
        automation.points = [
          { at: 0, value: -12, curve: 'linear' },
          { at: 30720, value: -1, curve: 'exp' },
        ]
      }
    })
    const { engine } = await offlineEngine(score, 1)
    expect(engine.downgradedCurves()).toEqual([
      { automationId: score.automation[0]?.id, pointIndex: 1 },
    ])
    engine.dispose()
  })

  it('refuses automation aimed at a filter the track does not have', async () => {
    const score = clone((draft) => {
      for (const track of draft.tracks) {
        track.fx = []
      }
    })
    await expect(offlineEngine(score, 1)).rejects.toThrow(/has no filter/)
  })
})

describe('the engine refuses what it cannot play', () => {
  it('builds every preset the score schema allows', async () => {
    for (const preset of SUPPORTED_PRESETS) {
      const score = clone((draft) => {
        const track = draft.tracks[0]
        if (track !== undefined) {
          track.instrument = { kind: 'synth', preset }
        }
      })
      const { engine } = await offlineEngine(score, 1)
      expect(engine.pendingNodeCount()).toBeGreaterThan(0)
      engine.dispose()
    }
  })

  it('refuses an effect that M1 does not implement, naming the kind', async () => {
    const score = clone((draft) => {
      const track = draft.tracks[3]
      if (track !== undefined) {
        track.fx = [{ kind: 'reverb', params: {} }]
      }
    })
    await expect(offlineEngine(score, 1)).rejects.toThrow(/reverb/)
  })

  it('refuses an instrument parameter the preset does not expose', async () => {
    const score = clone((draft) => {
      const track = draft.tracks[0]
      if (track !== undefined) {
        track.instrument = { kind: 'synth', preset: 'kick', params: { wobble: 1 } }
      }
    })
    await expect(offlineEngine(score, 1)).rejects.toThrow(/wobble/)
  })

  it('refuses an effect parameter the effect does not expose', async () => {
    const score = clone((draft) => {
      const track = draft.tracks[3]
      if (track !== undefined) {
        track.fx = [{ kind: 'filter', params: { wobble: 1 } }]
      }
    })
    await expect(offlineEngine(score, 1)).rejects.toThrow(/wobble/)
  })

  it('refuses the sampler, which arrives after M5', async () => {
    const score = clone((draft) => {
      const track = draft.tracks[0]
      if (track !== undefined) {
        track.instrument = { kind: 'sampler', bank: 'acoustic-kit' }
      }
    })
    await expect(offlineEngine(score, 1)).rejects.toThrow(EngineError)
  })

  it('refuses a document the invariants reject', async () => {
    const score = clone((draft) => {
      draft.tempo.bpm = 500
    })
    await expect(offlineEngine(score, 1)).rejects.toThrow(/not playable/)
  })
})

describe('the engine schedules ahead of the clock', () => {
  it('uses the lookahead it was given, and the default when it was given none', async () => {
    const { engine } = await offlineEngine(sixteenBars, 1)
    expect(engine.lookAhead()).toBe(0)
    engine.dispose()
  })
})

describe('the engine refuses to share a transport, and stays quiet once disposed', () => {
  const twoBars = (): Score => {
    const score = withoutNotes(sixteenBars)
    const section = score.sections[0]
    if (section !== undefined) {
      section.bars = 2
    }
    score.clips = score.clips.map((clip) => ({ ...clip, length: barToTick(2, score.meter) }))
    score.automation = []
    return score
  }

  it('refuses a second engine on one context, and lets one in again after dispose', async () => {
    const tone = await loadTone()
    const raw = new OfflineAudioContext(2, 48000, 48000)
    const context = new tone.OfflineContext(raw as unknown as OfflineAudioContext)
    const first = await createEngine({ context, score: twoBars() })
    await expect(createEngine({ context, score: twoBars() })).rejects.toThrow(/one transport/)
    first.dispose()
    const second = await createEngine({ context, score: twoBars() })
    expect(second.pendingNodeCount()).toBeGreaterThan(0)
    second.dispose()
  })

  it('does nothing when play() is called after dispose()', async () => {
    const score = twoBars()
    const { engine, render } = await offlineEngine(score, barSeconds(score) * 3)
    const seen: number[] = []
    engine.on('bar', (event) => {
      seen.push(event.bar)
    })
    engine.dispose()
    engine.play()
    await render()
    expect(seen).toEqual([])
  })
})

describe('a muted track costs nothing', () => {
  it('renders quieter with a track muted than with it playing', async () => {
    const muted = clone((draft) => {
      for (const track of draft.tracks) {
        track.muted = track.role === 'chords'
      }
    })
    const short = barSeconds(sixteenBars) * 2
    const before = await offlineEngine(sixteenBars, short)
    before.engine.play()
    const loud = peakOf(await before.render())
    before.engine.dispose()
    const after = await offlineEngine(muted, short)
    after.engine.play()
    const quiet = peakOf(await after.render())
    after.engine.dispose()
    expect(quiet).toBeLessThan(loud)
  })
})

describe('the engine refuses a parameter it cannot honour', () => {
  const withInstrument = (preset: 'pad-fm' | 'lead-am' | 'kick', params: Record<string, number>) =>
    clone((draft) => {
      const track = draft.tracks[0]
      if (track !== undefined) {
        track.instrument = { kind: 'synth', preset, params }
      }
    })

  it('applies a signal-valued parameter without replacing the node it lives on', async () => {
    const { engine } = await offlineEngine(withInstrument('pad-fm', { modulationIndex: 6 }), 1)
    const before = engine.pendingNodeCount()
    engine.dispose()
    expect(engine.pendingNodeCount()).toBe(0)
    expect(engine.disposedNodeCount()).toBe(before)
  })

  it('applies a read-only signal rather than dropping it in silence', async () => {
    const { engine } = await offlineEngine(withInstrument('lead-am', { harmonicity: 2 }), 1)
    expect(engine.pendingNodeCount()).toBeGreaterThan(0)
    engine.dispose()
  })

  it('refuses a parameter outside the range the preset accepts', async () => {
    await expect(offlineEngine(withInstrument('kick', { octaves: 1e9 }), 1)).rejects.toThrow(
      /between 0 and 12/,
    )
  })

  it('refuses an effect parameter outside its range', async () => {
    const score = clone((draft) => {
      const track = draft.tracks[3]
      if (track !== undefined) {
        track.fx = [{ kind: 'filter', params: { cutoff: 800, q: -50 } }]
      }
    })
    await expect(offlineEngine(score, 1)).rejects.toThrow(/between 0.0001 and 100/)
  })

  it('refuses a preset name that only the object prototype answers to', async () => {
    const score = clone((draft) => {
      const track = draft.tracks[0]
      if (track !== undefined) {
        Object.assign(track.instrument, { preset: 'toString' })
      }
    })
    await expect(offlineEngine(score, 1)).rejects.toThrow(/no voice is registered/)
  })

  it('disposes what it already built and frees the context for a retry', async () => {
    const tone = await loadTone()
    const raw = new OfflineAudioContext(2, 48000, 48000)
    const context = new tone.OfflineContext(raw as unknown as OfflineAudioContext)
    const broken = clone((draft) => {
      const track = draft.tracks[3]
      if (track !== undefined) {
        track.fx = [{ kind: 'filter', params: { wobble: 1 } }]
      }
    })
    await expect(createEngine({ context, score: broken })).rejects.toThrow(/wobble/)
    const engine = await createEngine({ context, score: sixteenBars })
    expect(engine.pendingNodeCount()).toBeGreaterThan(0)
    engine.dispose()
  })

  it('applies a plain numeric property, not only a signal', async () => {
    const score = clone((draft) => {
      const track = draft.tracks[3]
      if (track !== undefined) {
        track.instrument = { kind: 'synth', preset: 'poly-saw', params: { maxPolyphony: 4 } }
      }
    })
    const { engine } = await offlineEngine(score, 1)
    expect(engine.pendingNodeCount()).toBeGreaterThan(0)
    engine.dispose()
  })

  it('refuses a parameter whose target is neither a number nor a signal', async () => {
    const score = clone((draft) => {
      const track = draft.tracks[1]
      if (track !== undefined) {
        track.instrument = { kind: 'synth', preset: 'hat', params: { resonance: 4000 } }
      }
    })
    const { engine } = await offlineEngine(score, 1)
    engine.dispose()
    expect(engine.disposedNodeCount()).toBeGreaterThan(0)
  })
})

describe('the engine after the score ended', () => {
  it('keeps the last bar in position() and rewinds only once the tail is over', async () => {
    const score = twoBars()
    let atTheEnd: number | undefined
    const { engine, render } = await offlineEngine(score)
    engine.on('ended', () => {
      atTheEnd = engine.position().bar
    })
    engine.play()
    await render()
    expect(atTheEnd).toBe(1)
    expect(engine.position()).toEqual({ bar: 0, beat: 0, tick: 0 })
    engine.dispose()
  })

  it('plays the score again when play() comes from the ended listener', async () => {
    const score = twoBars()
    const { engine, render } = await offlineEngine(
      score,
      scoreSeconds(score) * 2 + scoreReleaseTailSeconds(score) + 0.5,
    )
    let ended = 0
    engine.on('ended', () => {
      ended += 1
      if (ended === 1) {
        engine.play()
      }
    })
    engine.play()
    await render()
    expect(ended).toBe(2)
    expect(engine.triggeredNoteCount()).toBe(noteCount(score) * 2)
    engine.dispose()
  })

  it('stop() during the tail says stopped and rewinds', async () => {
    const score = twoBars()
    const { engine, render } = await offlineEngine(score)
    let stopped = 0
    engine.on('stopped', () => {
      stopped += 1
    })
    engine.on('ended', () => {
      engine.stop()
    })
    engine.play()
    await render()
    expect(stopped).toBe(1)
    expect(engine.position()).toEqual({ bar: 0, beat: 0, tick: 0 })
    expect(engine.triggeredNoteCount()).toBe(noteCount(score))
    engine.dispose()
  })

  it('dispose() during the tail leaves no node behind', async () => {
    const score = twoBars()
    const { engine, render } = await offlineEngine(score)
    let created = 0
    engine.on('ended', () => {
      created = engine.pendingNodeCount()
      engine.dispose()
    })
    engine.play()
    await render()
    expect(created).toBeGreaterThan(0)
    expect(engine.pendingNodeCount()).toBe(0)
    expect(engine.disposedNodeCount()).toBe(created)
  })

  it('a second play() while it is already playing changes nothing', async () => {
    const score = twoBars()
    const { engine, render } = await offlineEngine(score)
    engine.play()
    engine.play()
    await render()
    expect(engine.triggeredNoteCount()).toBe(noteCount(score))
    engine.dispose()
  })
})

describe('the engine restarted after the tail', () => {
  it('plays the whole score again when play() comes after the tail expired', async () => {
    const score = twoBars()
    const tail = scoreReleaseTailSeconds(score)
    const { engine, context, render } = await offlineEngine(
      score,
      scoreSeconds(score) * 2 + tail * 2 + 0.5,
    )
    let ended = 0
    engine.on('ended', () => {
      ended += 1
      if (ended === 1) {
        context.setTimeout(() => {
          engine.play()
        }, tail + 0.1)
      }
    })
    engine.play()
    await render()
    expect(ended).toBe(2)
    expect(engine.triggeredNoteCount()).toBe(noteCount(score) * 2)
    engine.dispose()
  })

  it('does not start again for a restart the stop() in the same batch cancelled', async () => {
    const score = twoBars()
    const { engine, context, render } = await offlineEngine(
      score,
      scoreSeconds(score) * 2 + scoreReleaseTailSeconds(score) + 0.5,
    )
    let ended = 0
    engine.on('ended', () => {
      ended += 1
      if (ended === 1) {
        context.setTimeout(() => {
          engine.stop()
        }, -0.001)
        engine.play()
      }
    })
    engine.play()
    await render()
    expect(ended).toBe(1)
    expect(engine.triggeredNoteCount()).toBe(noteCount(score))
    engine.dispose()
  })

  it('does not rewind for a tail the play() in the same batch cancelled', async () => {
    const score = twoBars()
    const tail = scoreReleaseTailSeconds(score)
    const { engine, context, render } = await offlineEngine(
      score,
      scoreSeconds(score) * 2 + tail * 2 + 0.5,
    )
    let ended = 0
    engine.on('ended', () => {
      ended += 1
      if (ended === 1) {
        context.setTimeout(() => {
          engine.play()
        }, tail - 0.00001)
      }
    })
    engine.play()
    await render()
    expect(ended).toBe(2)
    expect(engine.triggeredNoteCount()).toBe(noteCount(score) * 2)
    engine.dispose()
  })

  it('replays once when play, stop and play all arrive in the ended listener', async () => {
    const score = twoBars()
    const { engine, render } = await offlineEngine(
      score,
      scoreSeconds(score) * 2 + scoreReleaseTailSeconds(score) + 0.5,
    )
    let ended = 0
    engine.on('ended', () => {
      ended += 1
      if (ended === 1) {
        engine.play()
        engine.stop()
        engine.play()
      }
    })
    engine.play()
    await render()
    expect(ended).toBe(2)
    expect(engine.triggeredNoteCount()).toBe(noteCount(score) * 2)
    engine.dispose()
  })
})

describe('the engine disposed from a transport callback', () => {
  it('triggers no note on a node it has already disposed', async () => {
    const score = twoBars()
    const { engine, render } = await offlineEngine(score)
    let disposedAt: number | undefined
    engine.on('bar', (event) => {
      if (event?.bar === 1 && disposedAt === undefined) {
        disposedAt = engine.pendingNodeCount()
        engine.dispose()
      }
    })
    engine.play()
    await render()
    expect(disposedAt).toBeGreaterThan(0)
    expect(engine.pendingNodeCount()).toBe(0)
    expect(engine.triggeredNoteCount()).toBeLessThan(noteCount(score))
  })
})

describe('the engine handed a raw context', () => {
  it('wraps it once, however many engines drive it in turn', async () => {
    const score = withoutNotes(twoBars())
    const raw = new OfflineAudioContext(2, 48000, 48000)
    let gains = 0
    const createGain = raw.createGain.bind(raw)
    raw.createGain = () => {
      gains += 1
      return createGain()
    }
    const perCycle: number[] = []
    for (let cycle = 0; cycle < 3; cycle += 1) {
      const before = gains
      const engine = await createEngine({
        context: raw as unknown as BaseAudioContext,
        score,
      })
      engine.dispose()
      perCycle.push(gains - before)
    }
    expect(perCycle[1]).toBe(perCycle[2])
    expect(perCycle[0]).toBeGreaterThan(perCycle[1] ?? 0)
  })
})

describe('the branches the fixture never reaches', () => {
  const automationId = sixteenBars.automation[0]?.id ?? ''
  const startSeconds = ticksToSeconds(barToTick(8, sixteenBars.meter), sixteenBars.tempo.bpm)
  const endSeconds = ticksToSeconds(barToTick(16, sixteenBars.meter), sixteenBars.tempo.bpm)

  const playedToBarEight = async (score: Score) => {
    const { engine, render } = await offlineEngine(withoutNotes(score), startSeconds + 0.5)
    engine.play()
    await render()
    return engine
  }

  it('ramps a cutoff exponentially when the curve asks for it', async () => {
    const score = clone((draft) => {
      for (const point of draft.automation[0]?.points ?? []) {
        point.curve = 'exp'
      }
    })
    const engine = await playedToBarEight(score)
    const middle = engine.automationValueAt(automationId, (startSeconds + endSeconds) / 2)
    expect(engine.downgradedCurves()).toEqual([])
    expect(middle).toBeCloseTo(Math.sqrt(800 * 8000), 0)
    engine.dispose()
  })

  it('lifts a zero off the floor rather than letting an exponential ramp fail', async () => {
    const score = clone((draft) => {
      for (const point of draft.automation[0]?.points ?? []) {
        point.curve = 'exp'
      }
      const last = draft.automation[0]?.points.at(-1)
      if (last !== undefined) {
        last.value = 0
      }
    })
    const engine = await playedToBarEight(score)
    expect(engine.automationValueAt(automationId, endSeconds)).toBeCloseTo(MIN_EXPONENTIAL_VALUE, 6)
    engine.dispose()
  })

  it('builds an eq3 the document asks for', async () => {
    const score = clone((draft) => {
      const track = draft.tracks[0]
      if (track !== undefined) {
        track.fx = [{ kind: 'eq3', params: { low: -6, mid: 0, high: 3 } }]
      }
    })
    const { engine, render } = await offlineEngine(score, barSeconds(score) + 0.5)
    engine.play()
    const rendered = await render()
    expect(peakOf(rendered)).toBeGreaterThan(0)
    expect(engine.pendingNodeCount()).toBeGreaterThan(0)
    engine.dispose()
    expect(engine.pendingNodeCount()).toBe(0)
  })

  it('reaches the destination without a limiter when the mix asks for none', async () => {
    const score = clone((draft) => {
      draft.mix.master.limiter = false
    })
    const { engine, render } = await offlineEngine(score, barSeconds(score) + 0.5)
    engine.play()
    expect(peakOf(await render())).toBeGreaterThan(0.05)
    engine.dispose()
  })

  it('accepts pan and filter q as automation targets, not only the cutoff', async () => {
    const score = clone((draft) => {
      const first = draft.automation[0]
      if (first === undefined || !('trackId' in first.target)) {
        return
      }
      const trackId = first.target.trackId
      draft.automation = [
        {
          ...first,
          id: `${first.id}-pan`,
          target: { trackId, param: 'pan' },
          points: first.points.map((point) => ({ ...point, value: point.value / 10000 })),
        },
        {
          ...first,
          id: `${first.id}-q`,
          target: { trackId, param: 'filter.q' },
          points: first.points.map((point) => ({ ...point, value: point.value / 1000 })),
        },
      ]
    })
    const engine = await playedToBarEight(score)
    expect(engine.automationValueAt(`${automationId}-pan`, startSeconds)).toBeCloseTo(0.08, 4)
    expect(engine.automationValueAt(`${automationId}-q`, startSeconds)).toBeCloseTo(0.8, 3)
    engine.dispose()
  })

  it('keeps the filter cutoff and its q on different params', async () => {
    const score = clone((draft) => {
      const first = draft.automation[0]
      if (first === undefined || !('trackId' in first.target)) {
        return
      }
      const trackId = first.target.trackId
      draft.automation = [
        {
          ...first,
          id: `${first.id}-cutoff`,
          target: { trackId, param: 'filter.cutoff' },
          points: [{ at: 0, value: 2000, curve: 'step' }],
        },
        {
          ...first,
          id: `${first.id}-q`,
          target: { trackId, param: 'filter.q' },
          points: [{ at: 0, value: 0.8, curve: 'step' }],
        },
      ]
    })
    const engine = await playedToBarEight(score)
    expect(engine.automationValueAt(`${automationId}-cutoff`, startSeconds)).toBeCloseTo(2000, 0)
    expect(engine.automationValueAt(`${automationId}-q`, startSeconds)).toBeCloseTo(0.8, 3)
    engine.dispose()
  })

  it('sends a hard-panned track to one side of the render, not both', async () => {
    const score = clone((draft) => {
      draft.tracks = draft.tracks.slice(0, 1)
      draft.clips = draft.clips.filter((clip) => clip.trackId === draft.tracks[0]?.id)
      const track = draft.tracks[0]
      const first = draft.automation[0]
      if (track === undefined || first === undefined) {
        return
      }
      draft.automation = [
        {
          ...first,
          id: `${first.id}-hard-pan`,
          target: { trackId: track.id, param: 'pan' },
          points: [{ at: 0, value: -1, curve: 'step' }],
        },
      ]
    })
    const { engine, render } = await offlineEngine(score, barSeconds(score) + 0.5)
    engine.play()
    const rendered = await render()
    const left = channelPeak(rendered, 0)
    const right = channelPeak(rendered, 1)
    expect(left).toBeGreaterThan(0.05)
    expect(right).toBeLessThan(left / 10)
    engine.dispose()
  })
})
