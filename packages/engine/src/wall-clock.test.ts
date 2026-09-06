import type { Score } from '@liminal/score'
import { sixteenBars } from '@liminal/score/fixtures'
import { afterAll, describe, expect, it } from 'vitest'
import { createEngine, DEFAULT_LOOK_AHEAD_SECONDS } from './engine.ts'
import { barSeconds, ticksToSeconds } from './time.ts'

const BARS_TO_HEAR = 2

const AGE_SECONDS = 3

const SILENT_GAIN_DB = -60

const silent = (): Score => {
  const score = structuredClone(sixteenBars)
  score.mix.master.gainDb = SILENT_GAIN_DB
  return score
}

const WANTED = process.env.LIMINAL_AUDIO_DEVICE === '1'

const openContext = (): AudioContext | undefined => {
  if (!WANTED) {
    return undefined
  }
  try {
    return new AudioContext({ sampleRate: 48000 })
  } catch {
    return undefined
  }
}

const context = openContext()

if (context === undefined) {
  process.stdout.write(
    WANTED
      ? 'no audio output device: the wall-clock tests are skipped, and the real clock is unproven here\n'
      : 'wall-clock tests skipped: set LIMINAL_AUDIO_DEVICE=1 to run them against the real device\n',
  )
}

describe.skipIf(context === undefined)('the wall clock drives the transport', () => {
  afterAll(async () => {
    await context?.close()
  })

  it('emits a bar per bar in real time, in order', async () => {
    if (context === undefined) {
      return
    }
    const engine = await createEngine({ context, score: silent() })
    const seen: number[] = []
    engine.on('bar', (event) => {
      if (event !== undefined) {
        seen.push(event.bar)
      }
    })
    engine.play()
    await new Promise((resolve) => {
      setTimeout(resolve, barSeconds(sixteenBars) * BARS_TO_HEAR * 1000)
    })
    engine.stop()
    engine.dispose()
    expect(seen.slice(0, BARS_TO_HEAR)).toEqual(
      Array.from({ length: BARS_TO_HEAR }, (_, index) => index),
    )
    expect(seen.length).toBeLessThanOrEqual(BARS_TO_HEAR + 1)
  })

  it('numbers the bars from the transport, not from a context that is already old', async () => {
    if (context === undefined) {
      return
    }
    await new Promise((resolve) => {
      setTimeout(resolve, AGE_SECONDS * 1000)
    })
    const engine = await createEngine({ context, score: silent() })
    const seen: number[] = []
    let positionAtFirstBar: number | undefined
    engine.on('bar', (event) => {
      if (event !== undefined) {
        seen.push(event.bar)
        positionAtFirstBar ??= engine.position().bar
      }
    })
    engine.play()
    await new Promise((resolve) => {
      setTimeout(resolve, barSeconds(sixteenBars) * 1000 + 200)
    })
    engine.stop()
    engine.dispose()
    expect(seen[0]).toBe(0)
    expect(positionAtFirstBar).toBe(0)
  })

  it('leaves the automation where the document puts it, however old the context is', async () => {
    if (context === undefined) {
      return
    }
    const automationId = sixteenBars.automation[0]?.id ?? ''
    const firstPointSeconds = ticksToSeconds(
      sixteenBars.automation[0]?.points[0]?.at ?? 0,
      sixteenBars.tempo.bpm,
    )
    const engine = await createEngine({ context, score: silent() })
    engine.play()
    await new Promise((resolve) => {
      setTimeout(resolve, 300)
    })
    const atTheRampStartIfItWereAbsolute = engine.automationValueAt(
      automationId,
      context.currentTime + firstPointSeconds,
    )
    const halfwayIfItWereAbsolute = engine.automationValueAt(
      automationId,
      context.currentTime + firstPointSeconds * 1.5,
    )
    engine.stop()
    engine.dispose()
    expect(atTheRampStartIfItWereAbsolute).toBeCloseTo(800, 0)
    expect(halfwayIfItWereAbsolute).toBeCloseTo(800, 0)
  })

  it('applies the lookahead a live context asks for', async () => {
    if (context === undefined) {
      return
    }
    const engine = await createEngine({ context, score: silent(), lookAheadSeconds: 0.05 })
    expect(engine.lookAhead()).toBeCloseTo(0.05, 5)
    engine.dispose()
    const byDefault = await createEngine({ context, score: silent() })
    expect(byDefault.lookAhead()).toBeCloseTo(DEFAULT_LOOK_AHEAD_SECONDS, 5)
    byDefault.dispose()
  })
})
