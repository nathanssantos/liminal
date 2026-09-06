import { describe, expect, it } from 'vitest'
import { sixteenBars } from './fixtures/index.ts'
import type { Score } from './schema.ts'
import { scoreSchema } from './schema.ts'
import { parse, stringify } from './serialize.ts'

const withFixture = (mutate: (score: Score) => void): Score => {
  const copy = structuredClone(sixteenBars)
  mutate(copy)
  return copy
}

const roundTrip = (score: Score) => parse(stringify(score))

describe('the schema carries the shape score.md declares', () => {
  it('round-trips a document that carries lineage', () => {
    const score = withFixture((draft) => {
      draft.lineage = { parentId: 'PARENT', styleCardId: 'CARD', label: 'a darker take' }
    })
    expect(roundTrip(score).lineage).toEqual(score.lineage)
  })

  it('round-trips every automation curve, not only linear', () => {
    const score = withFixture((draft) => {
      const automation = draft.automation[0]
      if (automation !== undefined) {
        automation.points = [
          { at: 0, value: 800, curve: 'step' },
          { at: 1920, value: 2000, curve: 'exp' },
          { at: 30720, value: 8000, curve: 'linear' },
        ]
      }
    })
    expect(roundTrip(score).automation[0]?.points.map((point) => point.curve)).toEqual([
      'step',
      'exp',
      'linear',
    ])
  })

  it('round-trips automation aimed at the master', () => {
    const score = withFixture((draft) => {
      const automation = draft.automation[0]
      if (automation !== undefined) {
        automation.target = { master: 'gainDb' }
      }
    })
    expect(roundTrip(score).automation[0]?.target).toEqual({ master: 'gainDb' })
  })

  it('round-trips a muted track', () => {
    const score = withFixture((draft) => {
      const track = draft.tracks[0]
      if (track !== undefined) {
        track.muted = true
      }
    })
    expect(roundTrip(score).tracks[0]?.muted).toBe(true)
  })

  it('keeps the sampler branch of the instrument discriminant readable', () => {
    const score = withFixture((draft) => {
      const track = draft.tracks[0]
      if (track !== undefined) {
        track.instrument = { kind: 'sampler', bank: 'acoustic-kit' }
      }
    })
    expect(roundTrip(score).tracks[0]?.instrument).toEqual({
      kind: 'sampler',
      bank: 'acoustic-kit',
    })
  })

  it('round-trips instrument and effect parameter bags', () => {
    const score = withFixture((draft) => {
      const track = draft.tracks[0]
      if (track !== undefined) {
        track.instrument = { kind: 'synth', preset: 'kick', params: { decay: 0.4, tune: -2 } }
      }
    })
    expect(roundTrip(score).tracks[0]?.instrument).toEqual({
      kind: 'synth',
      preset: 'kick',
      params: { decay: 0.4, tune: -2 },
    })
  })
})

describe('the schema refuses what it cannot represent', () => {
  it('refuses an unknown key instead of dropping it in silence', () => {
    const raw = JSON.parse(stringify(sixteenBars)) as Record<string, unknown>
    raw.tempoMap = []
    expect(scoreSchema.safeParse(raw).success).toBe(false)
  })

  it('refuses an unknown key nested inside a track', () => {
    const raw = JSON.parse(stringify(sixteenBars)) as { tracks: Record<string, unknown>[] }
    const track = raw.tracks[0]
    if (track !== undefined) {
      track.sidechain = true
    }
    expect(scoreSchema.safeParse(raw).success).toBe(false)
  })

  it('refuses an automation target that names both a track and the master', () => {
    const raw = JSON.parse(stringify(sixteenBars)) as {
      automation: { target: Record<string, unknown> }[]
    }
    const automation = raw.automation[0]
    if (automation !== undefined) {
      automation.target.master = 'gainDb'
    }
    expect(scoreSchema.safeParse(raw).success).toBe(false)
  })

  it('refuses NaN and Infinity, which JSON cannot carry either', () => {
    const raw = JSON.parse(stringify(sixteenBars)) as { tempo: { bpm: number } }
    raw.tempo.bpm = Number.NaN
    expect(scoreSchema.safeParse(raw).success).toBe(false)
    raw.tempo.bpm = Number.POSITIVE_INFINITY
    expect(scoreSchema.safeParse(raw).success).toBe(false)
  })

  it('refuses a version it does not know', () => {
    const raw = JSON.parse(stringify(sixteenBars)) as { version: number }
    raw.version = 2
    expect(scoreSchema.safeParse(raw).success).toBe(false)
  })

  it('refuses a beat unit other than the quarter note in v1', () => {
    const raw = JSON.parse(stringify(sixteenBars)) as { meter: { beatUnit: number } }
    raw.meter.beatUnit = 8
    expect(scoreSchema.safeParse(raw).success).toBe(false)
  })
})
