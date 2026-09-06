import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildSixteenBars, sixteenBars } from './fixtures/index.ts'
import { createRng } from './rng.ts'
import type { Score } from './schema.ts'
import { parse, ScoreParseError, stringify } from './serialize.ts'

const COMMITTED = fileURLToPath(new URL('../fixtures/sixteen-bars.json', import.meta.url))

function randomScore(seed: number): Score {
  const rng = createRng(seed)
  const draft = structuredClone(sixteenBars)
  draft.seed = seed
  draft.tempo.bpm = 90 + rng.int(60)
  draft.sections[0] = { ...(draft.sections[0] as Score['sections'][number]), energy: rng.next() }
  for (const clip of draft.clips) {
    clip.notes = clip.notes.map((note) => ({ ...note, velocity: rng.int(100) / 100 }))
  }
  return draft
}

describe('stringify', () => {
  it('sorts keys at every depth and keeps arrays in musical order', () => {
    const text = stringify(sixteenBars)
    const first = JSON.parse(text) as Record<string, unknown>
    expect(Object.keys(first)).toEqual([...Object.keys(first)].sort())
    const clip = (first.clips as Record<string, unknown>[])[0] as Record<string, unknown>
    expect(Object.keys(clip)).toEqual([...Object.keys(clip)].sort())
    expect((clip.notes as { at: number }[]).map((note) => note.at)).toEqual(
      (sixteenBars.clips[0]?.notes ?? []).map((note) => note.at),
    )
  })

  it('does not change between two runs', () => {
    expect(stringify(buildSixteenBars())).toBe(stringify(buildSixteenBars()))
  })

  it('matches the committed fixtures/sixteen-bars.json byte for byte', () => {
    expect(stringify(sixteenBars)).toBe(readFileSync(COMMITTED, 'utf8'))
  })
})

describe('parse', () => {
  it('round-trips the fixture', () => {
    expect(parse(stringify(sixteenBars))).toEqual(sixteenBars)
  })

  it('round-trips 100 documents generated with createRng', () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const score = randomScore(seed)
      expect(parse(stringify(score))).toEqual(score)
    }
  })

  it('reports the path of a shape error', () => {
    const text = stringify(sixteenBars).replace('"bpm": 128', '"bpm": "fast"')
    expect(() => parse(text)).toThrow(ScoreParseError)
    expect(() => parse(text)).toThrow(/tempo\.bpm/)
  })

  it('refuses a document that only the invariants reject', () => {
    const draft = structuredClone(sixteenBars)
    draft.tempo.bpm = 500
    expect(() => parse(stringify(draft))).toThrow(/E9/)
  })
})
