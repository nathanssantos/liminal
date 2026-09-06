import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildSixteenBars, sixteenBars } from './fixtures/index.ts'
import { createRng, newId } from './rng.ts'
import type { Score } from './schema.ts'
import { parse, ScoreParseError, stringify } from './serialize.ts'

const COMMITTED = fileURLToPath(new URL('../fixtures/sixteen-bars.json', import.meta.url))

const CURVES = ['step', 'linear', 'exp'] as const

function randomScore(seed: number): Score {
  const rng = createRng(seed)
  const draft = structuredClone(sixteenBars)
  const sectionId = newId(rng)
  draft.id = newId(rng)
  draft.seed = seed
  draft.tempo.bpm = 90 + rng.int(60)
  const bars = 4 + rng.int(12)
  draft.sections = [{ id: sectionId, role: 'build', startBar: 0, bars, energy: rng.next() }]
  const keptTracks = 1 + rng.int(draft.tracks.length)
  draft.tracks = draft.tracks.slice(0, keptTracks).map((track) => ({
    ...track,
    muted: rng.next() < 0.5,
    gainDb: 0 - (rng.int(29) + 1),
    pan: rng.int(3) - 1,
  }))
  const trackIds = new Set(draft.tracks.map((track) => track.id))
  const length = bars * 3840
  draft.clips = draft.clips
    .filter((clip) => trackIds.has(clip.trackId))
    .map((clip) => ({
      ...clip,
      length,
      notes: clip.notes
        .filter((note) => note.at + note.duration <= length)
        .map((note) => ({ ...note, velocity: rng.int(100) / 100 })),
    }))
  draft.automation = [
    {
      id: newId(rng),
      target: rng.next() < 0.5 ? { master: 'gainDb' } : { trackId: 'unused', param: 'gainDb' },
      points: [{ at: 0, value: rng.int(100) / 10, curve: rng.pick(CURVES) }],
    },
  ]
  const automation = draft.automation[0]
  const firstTrack = draft.tracks[0]
  if (automation !== undefined && firstTrack !== undefined && 'trackId' in automation.target) {
    automation.target.trackId = firstTrack.id
  }
  if (rng.next() < 0.5) {
    draft.lineage = { label: `run ${seed}` }
  } else {
    delete draft.lineage
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
    const shapes = new Set<string>()
    for (let seed = 1; seed <= 100; seed += 1) {
      const score = randomScore(seed)
      expect(parse(stringify(score))).toEqual(score)
      shapes.add(
        `${score.tracks.length}/${score.sections[0]?.bars}/${score.automation[0]?.points[0]?.curve}/${'lineage' in score}`,
      )
    }
    expect(shapes.size).toBeGreaterThan(10)
  })

  it('turns a negative zero into zero, which is all JSON can carry', () => {
    const draft = structuredClone(sixteenBars)
    const track = draft.tracks[0]
    if (track !== undefined) {
      track.gainDb = -0
    }
    expect(Object.is(parse(stringify(draft)).tracks[0]?.gainDb, 0)).toBe(true)
  })

  it('reports unreadable JSON as its own kind of failure', () => {
    let failure: unknown
    try {
      parse('{ not json')
    } catch (error) {
      failure = error
    }
    expect(failure).toBeInstanceOf(ScoreParseError)
    expect((failure as ScoreParseError).failure.kind).toBe('json')
    expect((failure as ScoreParseError).cause).toBeInstanceOf(Error)
  })

  it('carries the findings when only the invariants reject the document', () => {
    const draft = structuredClone(sixteenBars)
    draft.tempo.bpm = 500
    let failure: ScoreParseError | undefined
    try {
      parse(stringify(draft))
    } catch (error) {
      failure = error as ScoreParseError
    }
    const detail = failure?.failure
    expect(detail?.kind).toBe('invariants')
    expect(detail?.kind === 'invariants' && detail.findings.map((finding) => finding.code)).toEqual(
      ['E9'],
    )
  })

  it('reports the path of a shape error', () => {
    const text = stringify(sixteenBars).replace('"bpm": 128', '"bpm": "fast"')
    expect(() => parse(text)).toThrow(ScoreParseError)
    expect(() => parse(text)).toThrow(/tempo\.bpm/)
  })
})
