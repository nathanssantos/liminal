import { createRng, newId } from '../rng.ts'
import type { Clip, Note, Score, Track } from '../schema.ts'
import { PPQ } from '../schema.ts'
import { ticksPerBar } from '../time.ts'

const QUARTER = PPQ

const EIGHTH = PPQ / 2

const SIXTEENTH = PPQ / 4

const THIRTY_SECOND = PPQ / 8

const SEED = 20260905

const BARS = 16

const METER = { beatsPerBar: 4, beatUnit: 4 } as const

const TICKS_PER_BAR = ticksPerBar(METER)

const LENGTH = BARS * TICKS_PER_BAR

const KICK_PITCH = 36

const HAT_PITCH = 42

const BASS_ROOTS = [45, 43, 41, 40]

const CHORD_VOICINGS = [
  [57, 60, 64],
  [55, 59, 62],
  [53, 57, 60],
  [52, 56, 59],
]

function at<T>(items: readonly T[], index: number): T {
  const item = items[index]
  if (item === undefined) {
    throw new RangeError(`the fixture asked for index ${index} of ${items.length}`)
  }
  return item
}

const CUTOFF_START = 800

const CUTOFF_END = 8000

function kickNotes(): Note[] {
  const notes: Note[] = []
  for (let bar = 0; bar < BARS; bar += 1) {
    for (let beat = 0; beat < METER.beatsPerBar; beat += 1) {
      notes.push({
        at: bar * TICKS_PER_BAR + beat * QUARTER,
        duration: SIXTEENTH,
        pitch: KICK_PITCH,
        velocity: 0.9,
      })
    }
  }
  return notes
}

function hatNotes(): Note[] {
  const notes: Note[] = []
  for (let bar = 0; bar < BARS; bar += 1) {
    for (let eighthIndex = 0; eighthIndex < METER.beatsPerBar * 2; eighthIndex += 1) {
      notes.push({
        at: bar * TICKS_PER_BAR + eighthIndex * EIGHTH,
        duration: THIRTY_SECOND,
        pitch: HAT_PITCH,
        velocity: eighthIndex % 2 === 0 ? 0.5 : 0.8,
      })
    }
  }
  return notes
}

const BASS_NOTE_DURATION = 420

function bassNotes(): Note[] {
  const notes: Note[] = []
  for (let bar = 0; bar < BARS; bar += 1) {
    const pitch = at(BASS_ROOTS, bar % BASS_ROOTS.length)
    for (let eighthIndex = 0; eighthIndex < METER.beatsPerBar * 2; eighthIndex += 1) {
      notes.push({
        at: bar * TICKS_PER_BAR + eighthIndex * EIGHTH,
        duration: BASS_NOTE_DURATION,
        pitch,
        velocity: 0.7,
      })
    }
  }
  return notes
}

function chordNotes(): Note[] {
  const notes: Note[] = []
  for (let bar = 0; bar < BARS; bar += 1) {
    const voicing = at(CHORD_VOICINGS, bar % CHORD_VOICINGS.length)
    for (const pitch of voicing) {
      notes.push({
        at: bar * TICKS_PER_BAR,
        duration: TICKS_PER_BAR,
        pitch,
        velocity: 0.6,
      })
    }
  }
  return notes
}

export function buildSixteenBars(): Score {
  const rng = createRng(SEED)
  const sectionId = newId(rng)
  const kick: Track = {
    id: newId(rng),
    role: 'kick',
    instrument: { kind: 'synth', preset: 'kick' },
    gainDb: 0,
    pan: 0,
    muted: false,
    fx: [],
  }
  const hat: Track = {
    id: newId(rng),
    role: 'hat',
    instrument: { kind: 'synth', preset: 'hat' },
    gainDb: -6,
    pan: 0,
    muted: false,
    fx: [],
  }
  const bass: Track = {
    id: newId(rng),
    role: 'bass',
    instrument: { kind: 'synth', preset: 'bass-mono' },
    gainDb: -3,
    pan: 0,
    muted: false,
    fx: [],
  }
  const chords: Track = {
    id: newId(rng),
    role: 'chords',
    instrument: { kind: 'synth', preset: 'poly-saw' },
    gainDb: -9,
    pan: 0,
    muted: false,
    fx: [{ kind: 'filter', params: { cutoff: CUTOFF_START, q: 1 } }],
  }
  const tracks = [kick, hat, bass, chords]
  const notesByTrack = [kickNotes(), hatNotes(), bassNotes(), chordNotes()]
  const clips: Clip[] = tracks.map((track, index) => ({
    id: newId(rng),
    trackId: track.id,
    start: 0,
    length: LENGTH,
    notes: at(notesByTrack, index),
  }))
  const scoreId = newId(rng)
  const automationId = newId(rng)
  return {
    version: 1,
    id: scoreId,
    seed: SEED,
    tempo: { bpm: 128 },
    meter: { beatsPerBar: METER.beatsPerBar, beatUnit: METER.beatUnit },
    key: { tonic: 'A', mode: 'minor' },
    sections: [{ id: sectionId, role: 'drop', startBar: 0, bars: BARS, energy: 0.8 }],
    tracks,
    clips,
    automation: [
      {
        id: automationId,
        target: { trackId: chords.id, param: 'filter.cutoff' },
        points: [
          { at: 8 * TICKS_PER_BAR, value: CUTOFF_START, curve: 'linear' },
          { at: BARS * TICKS_PER_BAR, value: CUTOFF_END, curve: 'linear' },
        ],
      },
    ],
    mix: { master: { gainDb: -1, limiter: true } },
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const nested of Object.values(value)) {
      deepFreeze(nested)
    }
    Object.freeze(value)
  }
  return value
}

export const sixteenBars: Score = deepFreeze(buildSixteenBars())
