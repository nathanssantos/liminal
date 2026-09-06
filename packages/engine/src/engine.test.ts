import type { Score } from '@liminal/score'
import { barToTick } from '@liminal/score'
import { sixteenBars } from '@liminal/score/fixtures'
import { beforeAll, describe, expect, it } from 'vitest'
import { offlineEngine, peakOf } from '../tests/harness.ts'
import { EngineError } from './errors.ts'
import { SUPPORTED_PRESETS } from './instruments.ts'
import { barSeconds, scoreSeconds, ticksToSeconds } from './time.ts'

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

  beforeAll(async () => {
    const { engine, render } = await offlineEngine(sixteenBars)
    engine.on('bar', (event) => {
      if (event !== undefined) {
        bars.push(event.bar)
      }
    })
    engine.on('ended', (event) => {
      endedAt = event?.time
    })
    engine.play()
    peak = peakOf(await render())
    pendingBefore = engine.pendingNodeCount()
    engine.dispose()
    pendingAfter = engine.pendingNodeCount()
  })

  it('emits 16 bar events with bar 0 to 15 in order, and ended at the end', () => {
    expect(bars).toEqual(Array.from({ length: 16 }, (_, index) => index))
    expect(endedAt).toBeCloseTo(scoreSeconds(sixteenBars), 3)
  })

  it('renders audio rather than silence, under the limiter', () => {
    expect(peak).toBeGreaterThan(0.05)
    expect(peak).toBeLessThanOrEqual(1)
  })

  it('dispose() leaves the context with no engine node', () => {
    expect(pendingBefore).toBeGreaterThan(0)
    expect(pendingAfter).toBe(0)
  })
})

describe('the engine reports where it is', () => {
  it('position() during bar 4 returns bar 4', async () => {
    const { engine, render } = await offlineEngine(sixteenBars)
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
    const { engine, render } = await offlineEngine(sixteenBars)
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

  it('holds the first point value at the tick of bar 8', async () => {
    const { engine } = await offlineEngine(sixteenBars, 1)
    expect(engine.automationValueAt(automationId, startSeconds)).toBeCloseTo(800, 0)
    engine.dispose()
  })

  it('reaches the last point value at the end of the ramp', async () => {
    const { engine } = await offlineEngine(sixteenBars, 1)
    expect(engine.automationValueAt(automationId, endSeconds)).toBeCloseTo(8000, 0)
    engine.dispose()
  })

  it('is on the way up in the middle of the ramp, not still at the start', async () => {
    const { engine } = await offlineEngine(sixteenBars, 1)
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
    const { engine } = await offlineEngine(sixteenBars, 1)
    expect(engine.downgradedCurves()).toEqual([])
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
