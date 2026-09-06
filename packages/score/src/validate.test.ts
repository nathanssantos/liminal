import { describe, expect, it } from 'vitest'
import { sixteenBars } from './fixtures/index.ts'
import type { Score } from './schema.ts'
import { validate } from './validate.ts'

function broken(mutate: (score: Score) => void): Score {
  const copy = structuredClone(sixteenBars)
  mutate(copy)
  return copy
}

const codesOf = (score: Score) => validate(score).errors.map((error) => error.code)

const warningsOf = (score: Score) => validate(score).warnings.map((warning) => warning.code)

describe('validate errors', () => {
  it('E1 rejects a tick that is not a whole number', () => {
    const score = broken((draft) => {
      const clip = draft.clips[0]
      if (clip !== undefined) {
        clip.start = 10.5
      }
    })
    expect(codesOf(score)).toContain('E1')
  })

  it('E2 rejects sections that leave a gap', () => {
    const score = broken((draft) => {
      const section = draft.sections[0]
      if (section !== undefined) {
        section.startBar = 1
      }
    })
    expect(codesOf(score)).toContain('E2')
  })

  it('E3 rejects two elements with the same id', () => {
    const score = broken((draft) => {
      const [first, second] = draft.tracks
      if (first !== undefined && second !== undefined) {
        second.id = first.id
      }
    })
    expect(codesOf(score)).toContain('E3')
  })

  it('E4 rejects a clip pointing at a track that does not exist', () => {
    const score = broken((draft) => {
      const clip = draft.clips[0]
      if (clip !== undefined) {
        clip.trackId = 'ZZZZZZZZZZZZZZZZZZZZZZZZZZ'
      }
    })
    expect(codesOf(score)).toContain('E4')
  })

  it('E5 rejects a clip that ends past the score', () => {
    const score = broken((draft) => {
      const clip = draft.clips[0]
      if (clip !== undefined) {
        clip.start = 960
      }
    })
    expect(codesOf(score)).toContain('E5')
  })

  it('E6 rejects a note that does not fit its clip', () => {
    const score = broken((draft) => {
      const note = draft.clips[0]?.notes[0]
      if (note !== undefined) {
        note.duration = 1_000_000
      }
    })
    expect(codesOf(score)).toContain('E6')
  })

  it('E7 rejects two clips overlapping on the same track', () => {
    const score = broken((draft) => {
      const clip = draft.clips[0]
      if (clip !== undefined) {
        draft.clips.push({ ...clip, id: 'ZZZZZZZZZZZZZZZZZZZZZZZZZZ', notes: [] })
      }
    })
    expect(codesOf(score)).toContain('E7')
  })

  it('E8 rejects automation points that do not ascend', () => {
    const score = broken((draft) => {
      const points = draft.automation[0]?.points
      const second = points?.[1]
      const first = points?.[0]
      if (second !== undefined && first !== undefined) {
        second.at = first.at
      }
    })
    expect(codesOf(score)).toContain('E8')
  })

  it('E9 rejects a bpm outside 40..220', () => {
    const score = broken((draft) => {
      draft.tempo.bpm = 500
    })
    expect(codesOf(score)).toContain('E9')
  })

  it('cites the element id in the message', () => {
    const score = broken((draft) => {
      const clip = draft.clips[0]
      if (clip !== undefined) {
        clip.trackId = 'ZZZZZZZZZZZZZZZZZZZZZZZZZZ'
      }
    })
    const finding = validate(score).errors.find((error) => error.code === 'E4')
    expect(finding?.message).toContain(sixteenBars.clips[0]?.id ?? '')
  })
})

describe('validate warnings', () => {
  it('W1 warns about a note outside the range of the track role', () => {
    const score = broken((draft) => {
      const bassClip = draft.clips.find(
        (clip) => clip.trackId === draft.tracks.find((track) => track.role === 'bass')?.id,
      )
      const note = bassClip?.notes[0]
      if (note !== undefined) {
        note.pitch = 96
      }
    })
    expect(warningsOf(score)).toContain('W1')
  })

  it('W2 warns about a track with no clip', () => {
    const score = broken((draft) => {
      draft.clips = draft.clips.slice(1)
    })
    expect(warningsOf(score)).toContain('W2')
  })

  it('W3 warns about a section with no note sounding inside it', () => {
    const score = broken((draft) => {
      for (const clip of draft.clips) {
        clip.notes = []
      }
    })
    expect(warningsOf(score)).toContain('W3')
  })

  it('W4 warns about automation the instrument does not expose', () => {
    const score = broken((draft) => {
      for (const track of draft.tracks) {
        track.fx = []
      }
    })
    expect(warningsOf(score)).toContain('W4')
  })
})

describe('the sixteenBars fixture', () => {
  it('passes validate with zero errors and zero warnings', () => {
    const result = validate(sixteenBars)
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
  })
})

describe('the broken documents stay broken only where the test says', () => {
  it('leaves the fixture untouched', () => {
    const before = JSON.stringify(sixteenBars)
    broken((draft) => {
      draft.tempo.bpm = 500
    })
    expect(JSON.stringify(sixteenBars)).toBe(before)
  })

  it('does not reorder the caller clips while checking E7', () => {
    const order = sixteenBars.clips.map((clip) => clip.id)
    validate(sixteenBars)
    expect(sixteenBars.clips.map((clip) => clip.id)).toEqual(order)
  })
})
