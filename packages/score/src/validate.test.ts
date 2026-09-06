import { describe, expect, it } from 'vitest'
import { sixteenBars } from './fixtures/index.ts'
import type { Score, Section } from './schema.ts'
import { validate } from './validate.ts'

function broken(mutate: (score: Score) => void): Score {
  const copy = structuredClone(sixteenBars)
  mutate(copy)
  return copy
}

const codesOf = (score: Score) => validate(score).errors.map((error) => error.code)

const warningsOf = (score: Score) => validate(score).warnings.map((warning) => warning.code)

const firstClip = (score: Score) => {
  const clip = score.clips[0]
  if (clip === undefined) {
    throw new Error('the fixture has no clip')
  }
  return clip
}

const trackNamed = (score: Score, role: string) => {
  const track = score.tracks.find((candidate) => candidate.role === role)
  if (track === undefined) {
    throw new Error(`the fixture has no ${role} track`)
  }
  return track
}

const clipOf = (score: Score, role: string) => {
  const trackId = trackNamed(score, role).id
  const clip = score.clips.find((candidate) => candidate.trackId === trackId)
  if (clip === undefined) {
    throw new Error(`the fixture has no clip on ${role}`)
  }
  return clip
}

function twoSections(score: Score): Section[] {
  const section = score.sections[0]
  if (section === undefined) {
    throw new Error('the fixture has no section')
  }
  const half = section.bars / 2
  return [
    { ...section, bars: half },
    { ...section, id: `${section.id}B`, startBar: half, bars: half },
  ]
}

describe('the sixteenBars fixture', () => {
  it('passes validate with zero errors and zero warnings', () => {
    const result = validate(sixteenBars)
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
  })

  it('is clean, so a broken() case whose mutation did nothing would fail loudly', () => {
    expect(validate(broken(() => undefined)).errors).toEqual([])
    expect(validate(broken(() => undefined)).warnings).toEqual([])
  })
})

describe('E1 rejects a number that is not whole', () => {
  const cases: [string, (score: Score) => void][] = [
    ['section startBar', (score) => Object.assign(score.sections[0] as Section, { startBar: 0.5 })],
    ['section bars', (score) => Object.assign(score.sections[0] as Section, { bars: 15.5 })],
    ['clip start', (score) => Object.assign(firstClip(score), { start: 10.5 })],
    ['clip length', (score) => Object.assign(firstClip(score), { length: 61440.5 })],
    ['note at', (score) => Object.assign(firstClip(score).notes[0] ?? {}, { at: 0.25 })],
    ['note duration', (score) => Object.assign(firstClip(score).notes[0] ?? {}, { duration: 1.5 })],
    ['note pitch', (score) => Object.assign(firstClip(score).notes[0] ?? {}, { pitch: 36.5 })],
    [
      'automation point at',
      (score) => Object.assign(score.automation[0]?.points[0] ?? {}, { at: 30720.5 }),
    ],
    ['beats per bar', (score) => Object.assign(score.meter, { beatsPerBar: 4.0005 })],
    ['seed', (score) => Object.assign(score, { seed: 20260905.5 })],
  ]

  for (const [what, mutate] of cases) {
    it(`E1 rejects a fractional ${what}`, () => {
      expect(codesOf(broken(mutate))).toContain('E1')
    })
  }
})

describe('E2 rejects sections that do not tile the score from bar 0', () => {
  it('accepts two contiguous sections with no finding at all', () => {
    const score = broken((draft) => {
      draft.sections = twoSections(draft)
    })
    expect(validate(score).errors).toEqual([])
    expect(validate(score).warnings).toEqual([])
  })

  it('E2 rejects a gap before the first section', () => {
    expect(
      codesOf(broken((draft) => Object.assign(draft.sections[0] as Section, { startBar: 1 }))),
    ).toContain('E2')
  })

  it('E2 rejects two sections that overlap', () => {
    const score = broken((draft) => {
      const [first, second] = twoSections(draft)
      draft.sections = [first as Section, { ...(second as Section), startBar: 4 }]
    })
    expect(codesOf(score)).toContain('E2')
  })

  it('E2 rejects two sections out of order', () => {
    const score = broken((draft) => {
      const [first, second] = twoSections(draft)
      draft.sections = [second as Section, first as Section]
    })
    expect(codesOf(score)).toContain('E2')
  })

  it('E2 rejects a score with no section', () => {
    expect(
      codesOf(
        broken((draft) => {
          draft.sections = []
        }),
      ),
    ).toContain('E2')
  })
})

describe('E3 rejects a repeated id in any collection', () => {
  it('E3 rejects two sections with the same id', () => {
    const score = broken((draft) => {
      const [first, second] = twoSections(draft)
      draft.sections = [first as Section, { ...(second as Section), id: (first as Section).id }]
    })
    expect(codesOf(score)).toContain('E3')
  })

  it('E3 rejects two tracks with the same id', () => {
    const score = broken((draft) => {
      const [first, second] = draft.tracks
      if (first !== undefined && second !== undefined) {
        second.id = first.id
      }
    })
    expect(codesOf(score)).toContain('E3')
  })

  it('E3 rejects two clips with the same id', () => {
    const score = broken((draft) => {
      const [first, second] = draft.clips
      if (first !== undefined && second !== undefined) {
        second.id = first.id
      }
    })
    expect(codesOf(score)).toContain('E3')
  })

  it('E3 rejects two automations with the same id', () => {
    const score = broken((draft) => {
      const automation = draft.automation[0]
      if (automation !== undefined) {
        draft.automation = [automation, { ...automation, points: [] }]
      }
    })
    expect(codesOf(score)).toContain('E3')
  })
})

describe('E4 rejects a reference to a track the score does not have', () => {
  const missing = 'ZZZZZZZZZZZZZZZZZZZZZZZZZZ'

  it('E4 rejects a clip pointing at a track that does not exist', () => {
    expect(
      codesOf(broken((draft) => Object.assign(firstClip(draft), { trackId: missing }))),
    ).toContain('E4')
  })

  it('E4 rejects automation pointing at a track that does not exist', () => {
    const score = broken((draft) => {
      const automation = draft.automation[0]
      if (automation !== undefined && 'trackId' in automation.target) {
        automation.target.trackId = missing
      }
    })
    expect(codesOf(score)).toContain('E4')
  })
})

describe('E5 rejects a clip that ends past the score', () => {
  it('E5 rejects a clip that ends past the score', () => {
    expect(codesOf(broken((draft) => Object.assign(firstClip(draft), { start: 960 })))).toContain(
      'E5',
    )
  })
})

describe('E6 rejects a note that does not fit its clip', () => {
  it('E6 rejects a note that ends past the clip', () => {
    const score = broken((draft) =>
      Object.assign(firstClip(draft).notes[0] ?? {}, { duration: 1_000_000 }),
    )
    expect(codesOf(score)).toContain('E6')
  })

  it('E6 rejects a note that starts before the clip', () => {
    const score = broken((draft) => Object.assign(firstClip(draft).notes[0] ?? {}, { at: -960 }))
    expect(codesOf(score)).toContain('E6')
  })
})

describe('E7 rejects clips that overlap on the same track', () => {
  it('E7 rejects two clips overlapping on the same track', () => {
    const score = broken((draft) => {
      const clip = firstClip(draft)
      draft.clips.push({ ...clip, id: 'ZZZZZZZZZZZZZZZZZZZZZZZZZZ', notes: [] })
    })
    expect(codesOf(score)).toContain('E7')
  })

  it('accepts two clips on one track that touch without overlapping', () => {
    const score = broken((draft) => {
      const clip = firstClip(draft)
      const half = clip.length / 2
      clip.length = half
      clip.notes = clip.notes.filter((note) => note.at + note.duration <= half)
      draft.clips.push({
        ...clip,
        id: 'ZZZZZZZZZZZZZZZZZZZZZZZZZZ',
        start: half,
        length: half,
        notes: [],
      })
    })
    expect(codesOf(score)).not.toContain('E7')
  })

  it('leaves three clips alone when they are written out of order but do not overlap', () => {
    const score = broken((draft) => {
      const clip = firstClip(draft)
      const span = clip.length / 4
      clip.length = span
      clip.notes = clip.notes.filter((note) => note.at + note.duration <= span)
      const later = { ...clip, id: 'ZZZZZZZZZZZZZZZZZZZZZZZZZZ', start: span * 3, notes: [] }
      const middle = { ...clip, id: 'YYYYYYYYYYYYYYYYYYYYYYYYYY', start: span, notes: [] }
      draft.clips = [clip, later, middle, ...draft.clips.slice(1)]
    })
    expect(codesOf(score)).not.toContain('E7')
  })

  it('E7 rejects two clips that overlap by a single tick', () => {
    const score = broken((draft) => {
      const clip = firstClip(draft)
      const half = clip.length / 2
      clip.length = half
      clip.notes = clip.notes.filter((note) => note.at + note.duration <= half)
      draft.clips.push({
        ...clip,
        id: 'ZZZZZZZZZZZZZZZZZZZZZZZZZZ',
        start: half - 1,
        length: half,
        notes: [],
      })
    })
    expect(codesOf(score)).toContain('E7')
  })

  it('finds the overlap whichever order the two clips are written in', () => {
    const score = broken((draft) => {
      const clip = firstClip(draft)
      const later = { ...clip, id: 'ZZZZZZZZZZZZZZZZZZZZZZZZZZ', start: 960, notes: [] }
      draft.clips = [later, ...draft.clips]
      later.length = clip.length
    })
    expect(codesOf(score)).toContain('E7')
  })
})

describe('E8 rejects automation points that do not ascend', () => {
  it('E8 rejects two points at the same tick', () => {
    const score = broken((draft) => {
      const points = draft.automation[0]?.points
      const first = points?.[0]
      const second = points?.[1]
      if (first !== undefined && second !== undefined) {
        second.at = first.at
      }
    })
    expect(codesOf(score)).toContain('E8')
  })
})

describe('E9 rejects a number outside its range', () => {
  const cases: [string, (score: Score) => void][] = [
    ['bpm above 220', (score) => Object.assign(score.tempo, { bpm: 500 })],
    ['bpm below 40', (score) => Object.assign(score.tempo, { bpm: 20 })],
    ['beats per bar above 12', (score) => Object.assign(score.meter, { beatsPerBar: 13 })],
    ['seed above uint32', (score) => Object.assign(score, { seed: 0x1_0000_0000 })],
    ['master gain above 6 dB', (score) => Object.assign(score.mix.master, { gainDb: 12 })],
    [
      'section energy above 1',
      (score) => Object.assign(score.sections[0] as Section, { energy: 1.5 }),
    ],
    ['track gain below -60 dB', (score) => Object.assign(score.tracks[0] ?? {}, { gainDb: -80 })],
    ['track pan beyond 1', (score) => Object.assign(score.tracks[0] ?? {}, { pan: 2 })],
    [
      'note pitch above 127',
      (score) => Object.assign(firstClip(score).notes[0] ?? {}, { pitch: 200 }),
    ],
    [
      'note velocity above 1',
      (score) => Object.assign(firstClip(score).notes[0] ?? {}, { velocity: 1.5 }),
    ],
  ]

  for (const [what, mutate] of cases) {
    it(`E9 rejects a ${what}`, () => {
      expect(codesOf(broken(mutate))).toContain('E9')
    })
  }

  const notFinite: [string, (score: Score) => void][] = [
    ['bpm', (score) => Object.assign(score.tempo, { bpm: Number.NaN })],
    ['track gain', (score) => Object.assign(score.tracks[0] ?? {}, { gainDb: Number.NaN })],
    ['track pan', (score) => Object.assign(score.tracks[0] ?? {}, { pan: Number.NaN })],
    [
      'section energy',
      (score) => Object.assign(score.sections[0] as Section, { energy: Number.NaN }),
    ],
    [
      'note velocity',
      (score) => Object.assign(firstClip(score).notes[0] ?? {}, { velocity: Number.NaN }),
    ],
    ['master gain', (score) => Object.assign(score.mix.master, { gainDb: Number.NaN })],
    [
      'automation point value',
      (score) => Object.assign(score.automation[0]?.points[0] ?? {}, { value: Number.NaN }),
    ],
    [
      'effect parameter',
      (score) => {
        const effect = trackNamed(score, 'chords').fx[0]
        if (effect !== undefined) {
          effect.params.cutoff = Number.NaN
        }
      },
    ],
    [
      'instrument parameter',
      (score) => {
        const track = trackNamed(score, 'kick')
        track.instrument = { kind: 'synth', preset: 'kick', params: { decay: Number.NaN } }
      },
    ],
  ]

  for (const [what, mutate] of notFinite) {
    it(`E9 rejects a NaN ${what}, which no comparison catches`, () => {
      expect(codesOf(broken(mutate))).toContain('E9')
    })
  }
})

describe('every finding names the element it is about', () => {
  const cases: [string, (score: Score) => void, (score: Score) => string][] = [
    [
      'E4 names the clip',
      (score) => Object.assign(firstClip(score), { trackId: 'ZZZZZZZZZZZZZZZZZZZZZZZZZZ' }),
      (score) => firstClip(score).id,
    ],
    [
      'E9 names the section',
      (score) => Object.assign(score.sections[0] as Section, { energy: 9 }),
      (score) => (score.sections[0] as Section).id,
    ],
    [
      'E9 names the track',
      (score) => Object.assign(score.tracks[0] ?? {}, { pan: 9 }),
      (score) => score.tracks[0]?.id ?? '',
    ],
    [
      'E3 names the repeated id',
      (score) => {
        const [first, second] = score.tracks
        if (first !== undefined && second !== undefined) {
          second.id = first.id
        }
      },
      (score) => score.tracks[0]?.id ?? '',
    ],
  ]

  for (const [what, mutate, expected] of cases) {
    it(what, () => {
      const score = broken(mutate)
      const id = expected(sixteenBars)
      expect(id).not.toBe('')
      const messages = validate(score).errors.map((error) => error.message)
      expect(messages.some((message) => message.includes(id))).toBe(true)
    })
  }
})

describe('validate warnings', () => {
  it('W1 warns about a note below the range of the track role', () => {
    const score = broken((draft) =>
      Object.assign(clipOf(draft, 'bass').notes[0] ?? {}, { pitch: 20 }),
    )
    expect(warningsOf(score)).toContain('W1')
  })

  it('W1 warns about a note above the range of the track role', () => {
    const score = broken((draft) =>
      Object.assign(clipOf(draft, 'chords').notes[0] ?? {}, { pitch: 100 }),
    )
    expect(warningsOf(score)).toContain('W1')
  })

  it('W1 leaves percussion alone, because pitch there selects a variation', () => {
    const score = broken((draft) =>
      Object.assign(clipOf(draft, 'kick').notes[0] ?? {}, { pitch: 120 }),
    )
    expect(warningsOf(score)).not.toContain('W1')
  })

  it('W2 warns about a track with no clip', () => {
    expect(
      warningsOf(
        broken((draft) => {
          draft.clips = draft.clips.slice(1)
        }),
      ),
    ).toContain('W2')
  })

  it('W3 warns about a section with no note sounding inside it', () => {
    const score = broken((draft) => {
      draft.sections = twoSections(draft)
      for (const clip of draft.clips) {
        clip.notes = clip.notes.filter((note) => clip.start + note.at < 8 * 3840)
      }
    })
    expect(warningsOf(score)).toContain('W3')
  })

  it('W3 stays quiet while every section has a note sounding in it', () => {
    expect(
      warningsOf(
        broken((draft) => {
          draft.sections = twoSections(draft)
        }),
      ),
    ).not.toContain('W3')
  })

  it('W3 stays quiet for a section whose only note started in the section before it', () => {
    const score = broken((draft) => {
      draft.sections = twoSections(draft)
      for (const clip of draft.clips) {
        clip.notes = []
      }
      const first = firstClip(draft)
      first.notes = [
        { at: 0, duration: first.length, pitch: 36, velocity: 0.9 },
        { at: 100, duration: 960, pitch: 36, velocity: 0.9 },
      ]
    })
    expect(warningsOf(score)).not.toContain('W3')
  })

  it('W3 warns about a section whose only note ends exactly where it starts', () => {
    const score = broken((draft) => {
      draft.sections = twoSections(draft)
      for (const clip of draft.clips) {
        clip.notes = []
      }
      const first = firstClip(draft)
      first.notes = [{ at: 0, duration: 8 * 3840, pitch: 36, velocity: 0.9 }]
    })
    expect(warningsOf(score)).toContain('W3')
  })

  it('W3 warns about a section whose only note starts exactly where it ends', () => {
    const score = broken((draft) => {
      draft.sections = twoSections(draft)
      for (const clip of draft.clips) {
        clip.notes = []
      }
      const first = firstClip(draft)
      first.notes = [{ at: 8 * 3840, duration: 960, pitch: 36, velocity: 0.9 }]
    })
    const sections = validate(score).warnings.filter((warning) => warning.code === 'W3')
    expect(sections.map((warning) => warning.path[1])).toEqual([0])
  })

  it('W4 warns about automation the track exposes no effect for', () => {
    expect(
      warningsOf(
        broken((draft) => {
          for (const track of draft.tracks) {
            track.fx = []
          }
        }),
      ),
    ).toContain('W4')
  })

  it('W4 stays quiet for a parameter every track exposes', () => {
    const score = broken((draft) => {
      const automation = draft.automation[0]
      if (automation !== undefined && 'trackId' in automation.target) {
        automation.target.param = 'gainDb'
      }
      for (const track of draft.tracks) {
        track.fx = []
      }
    })
    expect(warningsOf(score)).not.toContain('W4')
  })

  it('W4 stays quiet for automation on the master', () => {
    const score = broken((draft) => {
      const automation = draft.automation[0]
      if (automation !== undefined) {
        automation.target = { master: 'gainDb' }
      }
      for (const track of draft.tracks) {
        track.fx = []
      }
    })
    expect(warningsOf(score)).not.toContain('W4')
  })
})

describe('validate leaves the document it is given untouched', () => {
  it('does not mutate the fixture', () => {
    const before = JSON.stringify(sixteenBars)
    validate(sixteenBars)
    expect(JSON.stringify(sixteenBars)).toBe(before)
  })

  it('does not reorder clips while checking E7', () => {
    const score = broken((draft) => {
      const clip = firstClip(draft)
      const half = clip.length / 2
      clip.length = half
      clip.notes = []
      draft.clips.unshift({ ...clip, id: 'ZZZZZZZZZZZZZZZZZZZZZZZZZZ', start: half, notes: [] })
    })
    const order = score.clips.map((clip) => clip.id)
    validate(score)
    expect(score.clips.map((clip) => clip.id)).toEqual(order)
  })
})
