import type { Score } from '@liminal/score'
import { barToTick } from '@liminal/score'
import { sixteenBars } from '@liminal/score/fixtures'
import * as tone from 'tone'
import { afterAll, describe, expect, it } from 'vitest'
import { createEngine, DEFAULT_LOOK_AHEAD_SECONDS, SAFE_OUTPUT_GAIN_DB } from './engine.ts'
import { barSeconds, ticksToSeconds } from './time.ts'

const BARS_TO_HEAR = 2

const AGE_SECONDS = 3

const SILENT_GAIN_DB = -60

const OUTPUT_GAIN_DB_WELL_BELOW_SAFE = -40

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

const SETTLE_MS = 400

const LOUD_ENOUGH_TO_HEAR = 0.001

const listening = (): { toneContext: tone.Context; level: () => number } | undefined => {
  if (context === undefined) return undefined
  const toneContext = new tone.Context({ context, clockSource: 'timeout' })
  const meter = new tone.Meter({ context: toneContext, normalRange: true, smoothing: 0 })
  toneContext.destination.connect(meter)
  return { toneContext, level: () => meter.getValue() as number }
}

describe.skipIf(context === undefined)('muting acts on the output, not on the transport', () => {
  it('drops what leaves the app to silence and brings it back, while the transport keeps counting', async () => {
    const ears = listening()
    if (ears === undefined) return
    const engine = await createEngine({ context: ears.toneContext, score: sixteenBars })

    engine.play()
    await new Promise((done) => setTimeout(done, barSeconds(sixteenBars) * 1000))
    const loud = ears.level()
    const before = engine.position()
    expect(loud).toBeGreaterThan(LOUD_ENOUGH_TO_HEAR)

    engine.setMuted(true)
    await new Promise((done) => setTimeout(done, SETTLE_MS))
    expect(ears.level()).toBe(0)
    await new Promise((done) => setTimeout(done, barSeconds(sixteenBars) * 1000))
    const whileMuted = engine.position()

    engine.setMuted(false)
    await new Promise((done) => setTimeout(done, SETTLE_MS))
    expect(ears.level()).toBeGreaterThan(LOUD_ENOUGH_TO_HEAR)

    expect(whileMuted.bar).toBeGreaterThan(before.bar)
    expect(engine.outputGain()).toBe(SAFE_OUTPUT_GAIN_DB)
    engine.stop()
    engine.dispose()
  })

  it('lowers what leaves the app when the volume drops, without touching the document', async () => {
    const ears = listening()
    if (ears === undefined) return
    const engine = await createEngine({ context: ears.toneContext, score: sixteenBars })

    engine.play()
    await new Promise((done) => setTimeout(done, barSeconds(sixteenBars) * 1000))
    const atSafe = ears.level()
    expect(atSafe).toBeGreaterThan(LOUD_ENOUGH_TO_HEAR)

    engine.setOutputGain(OUTPUT_GAIN_DB_WELL_BELOW_SAFE)
    await new Promise((done) => setTimeout(done, SETTLE_MS))
    expect(ears.level()).toBeLessThan(atSafe / 2)

    engine.setOutputGain(SAFE_OUTPUT_GAIN_DB)
    await new Promise((done) => setTimeout(done, SETTLE_MS))
    expect(ears.level()).toBeGreaterThan(LOUD_ENOUGH_TO_HEAR)
    expect(engine.appliedOutputGain()).toBeCloseTo(10 ** (SAFE_OUTPUT_GAIN_DB / 20), 6)
    engine.stop()
    engine.dispose()
  })
})

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

  it('triggers only the notes it has, and plays again while the last ones still ring', async () => {
    if (context === undefined) {
      return
    }
    const score = silent()
    score.tempo.bpm = 220
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
    const written = score.clips.reduce((total, clip) => total + clip.notes.length, 0)
    const engine = await createEngine({ context, score })
    let ended = 0
    const endings: Promise<void>[] = []
    let announce: (() => void) | undefined
    const nextEnding = () =>
      new Promise<void>((resolve) => {
        announce = resolve
      })
    endings.push(nextEnding())
    engine.on('ended', () => {
      ended += 1
      announce?.()
    })
    engine.play()
    await endings[0]
    const triggeredOnce = engine.triggeredNoteCount()
    endings.push(nextEnding())
    await new Promise((resolve) => {
      setTimeout(resolve, 100)
    })
    engine.play()
    await endings[1]
    const triggeredTwice = engine.triggeredNoteCount()
    engine.dispose()
    expect(ended).toBe(2)
    expect(triggeredOnce).toBe(written)
    expect(triggeredTwice).toBe(written * 2)
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
