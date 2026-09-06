import { PARAM_REQUIRES_FX, PITCHED_ROLE_RANGES, RANGES } from './constants.ts'
import type { Automation, Clip, Score, Track } from './schema.ts'
import { scoreLengthTicks, ticksPerBar } from './time.ts'

export type FindingCode =
  | 'E1'
  | 'E2'
  | 'E3'
  | 'E4'
  | 'E5'
  | 'E6'
  | 'E7'
  | 'E8'
  | 'E9'
  | 'W1'
  | 'W2'
  | 'W3'
  | 'W4'

export type Finding = {
  code: FindingCode
  message: string
  path: (string | number)[]
}

export type ValidationResult = {
  errors: Finding[]
  warnings: Finding[]
}

type Range = { min: number; max: number }

const isWholeAtLeast = (value: number, minimum: number) =>
  Number.isInteger(value) && value >= minimum

function checkE1(score: Score, errors: Finding[]): void {
  score.sections.forEach((section, index) => {
    if (!isWholeAtLeast(section.startBar, 0)) {
      errors.push({
        code: 'E1',
        message: `section ${section.id} has startBar ${section.startBar}, which is not a whole bar ≥ 0`,
        path: ['sections', index, 'startBar'],
      })
    }
    if (!isWholeAtLeast(section.bars, 1)) {
      errors.push({
        code: 'E1',
        message: `section ${section.id} lasts ${section.bars} bars, which is not a whole number ≥ 1`,
        path: ['sections', index, 'bars'],
      })
    }
  })
  score.clips.forEach((clip, index) => {
    if (!isWholeAtLeast(clip.start, 0)) {
      errors.push({
        code: 'E1',
        message: `clip ${clip.id} starts at tick ${clip.start}, which is not a whole tick ≥ 0`,
        path: ['clips', index, 'start'],
      })
    }
    if (!isWholeAtLeast(clip.length, 1)) {
      errors.push({
        code: 'E1',
        message: `clip ${clip.id} is ${clip.length} ticks long, which is not a whole number ≥ 1`,
        path: ['clips', index, 'length'],
      })
    }
    clip.notes.forEach((note, noteIndex) => {
      if (!isWholeAtLeast(note.at, 0)) {
        errors.push({
          code: 'E1',
          message: `note ${noteIndex} of clip ${clip.id} is at tick ${note.at}, which is not a whole tick ≥ 0`,
          path: ['clips', index, 'notes', noteIndex, 'at'],
        })
      }
      if (!isWholeAtLeast(note.duration, 1)) {
        errors.push({
          code: 'E1',
          message: `note ${noteIndex} of clip ${clip.id} lasts ${note.duration} ticks, which is not a whole number ≥ 1`,
          path: ['clips', index, 'notes', noteIndex, 'duration'],
        })
      }
    })
  })
  score.automation.forEach((automation, index) => {
    automation.points.forEach((point, pointIndex) => {
      if (!isWholeAtLeast(point.at, 0)) {
        errors.push({
          code: 'E1',
          message: `point ${pointIndex} of automation ${automation.id} is at tick ${point.at}, which is not a whole tick ≥ 0`,
          path: ['automation', index, 'points', pointIndex, 'at'],
        })
      }
    })
  })
}

function checkE2(score: Score, errors: Finding[]): void {
  let expectedStart = 0
  score.sections.forEach((section, index) => {
    if (section.startBar !== expectedStart) {
      errors.push({
        code: 'E2',
        message: `section ${section.id} starts at bar ${section.startBar}, but the previous sections end at bar ${expectedStart}`,
        path: ['sections', index, 'startBar'],
      })
    }
    expectedStart = section.startBar + section.bars
  })
}

function checkE3(score: Score, errors: Finding[]): void {
  const collections = [
    ['sections', score.sections],
    ['tracks', score.tracks],
    ['clips', score.clips],
    ['automation', score.automation],
  ] as const
  for (const [name, items] of collections) {
    const seen = new Set<string>()
    items.forEach((item: { id: string }, index: number) => {
      if (seen.has(item.id)) {
        errors.push({
          code: 'E3',
          message: `${name} contains more than one element with id ${item.id}`,
          path: [name, index, 'id'],
        })
      }
      seen.add(item.id)
    })
  }
}

function checkE4(score: Score, errors: Finding[]): void {
  const trackIds = new Set(score.tracks.map((track: Track) => track.id))
  score.clips.forEach((clip, index) => {
    if (!trackIds.has(clip.trackId)) {
      errors.push({
        code: 'E4',
        message: `clip ${clip.id} references track ${clip.trackId}, which the score does not have`,
        path: ['clips', index, 'trackId'],
      })
    }
  })
  score.automation.forEach((automation, index) => {
    const target = automation.target
    if ('trackId' in target && !trackIds.has(target.trackId)) {
      errors.push({
        code: 'E4',
        message: `automation ${automation.id} references track ${target.trackId}, which the score does not have`,
        path: ['automation', index, 'target', 'trackId'],
      })
    }
  })
}

function checkE5(score: Score, errors: Finding[]): void {
  const length = scoreLengthTicks(score)
  score.clips.forEach((clip, index) => {
    if (clip.start + clip.length > length) {
      errors.push({
        code: 'E5',
        message: `clip ${clip.id} ends at tick ${clip.start + clip.length}, past the score's ${length} ticks`,
        path: ['clips', index],
      })
    }
  })
}

function checkE6(score: Score, errors: Finding[]): void {
  score.clips.forEach((clip, index) => {
    clip.notes.forEach((note, noteIndex) => {
      if (note.at < 0 || note.at + note.duration > clip.length) {
        errors.push({
          code: 'E6',
          message: `note ${noteIndex} of clip ${clip.id} spans ticks ${note.at}–${note.at + note.duration}, outside the clip's ${clip.length} ticks`,
          path: ['clips', index, 'notes', noteIndex],
        })
      }
    })
  })
}

function checkE7(score: Score, errors: Finding[]): void {
  const byTrack = new Map<string, Clip[]>()
  for (const clip of score.clips) {
    const clips = byTrack.get(clip.trackId) ?? []
    clips.push(clip)
    byTrack.set(clip.trackId, clips)
  }
  for (const [trackId, clips] of byTrack) {
    const ordered = clips.toSorted((left, right) => left.start - right.start)
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1]
      const current = ordered[index]
      if (previous === undefined || current === undefined) {
        continue
      }
      if (current.start < previous.start + previous.length) {
        errors.push({
          code: 'E7',
          message: `clips ${previous.id} and ${current.id} overlap on track ${trackId}`,
          path: ['clips', score.clips.indexOf(current)],
        })
      }
    }
  }
}

function checkE8(score: Score, errors: Finding[]): void {
  score.automation.forEach((automation: Automation, index) => {
    for (let pointIndex = 1; pointIndex < automation.points.length; pointIndex += 1) {
      const previous = automation.points[pointIndex - 1]
      const current = automation.points[pointIndex]
      if (previous === undefined || current === undefined) {
        continue
      }
      if (current.at <= previous.at) {
        errors.push({
          code: 'E8',
          message: `automation ${automation.id} has point ${pointIndex} at tick ${current.at}, not after the previous tick ${previous.at}`,
          path: ['automation', index, 'points', pointIndex, 'at'],
        })
      }
    }
  })
}

function outside(value: number, range: Range): boolean {
  return value < range.min || value > range.max
}

function checkE9(score: Score, errors: Finding[]): void {
  if (outside(score.tempo.bpm, RANGES.bpm)) {
    errors.push({
      code: 'E9',
      message: `score ${score.id} has bpm ${score.tempo.bpm}, outside ${RANGES.bpm.min}–${RANGES.bpm.max}`,
      path: ['tempo', 'bpm'],
    })
  }
  if (outside(score.meter.beatsPerBar, RANGES.beatsPerBar)) {
    errors.push({
      code: 'E9',
      message: `score ${score.id} has ${score.meter.beatsPerBar} beats per bar, outside ${RANGES.beatsPerBar.min}–${RANGES.beatsPerBar.max}`,
      path: ['meter', 'beatsPerBar'],
    })
  }
  if (outside(score.seed, RANGES.seed) || !Number.isInteger(score.seed)) {
    errors.push({
      code: 'E9',
      message: `score ${score.id} has seed ${score.seed}, which is not a uint32`,
      path: ['seed'],
    })
  }
  if (outside(score.mix.master.gainDb, RANGES.gainDb)) {
    errors.push({
      code: 'E9',
      message: `score ${score.id} has master gain ${score.mix.master.gainDb} dB, outside ${RANGES.gainDb.min}–${RANGES.gainDb.max}`,
      path: ['mix', 'master', 'gainDb'],
    })
  }
  score.sections.forEach((section, index) => {
    if (outside(section.energy, RANGES.energy)) {
      errors.push({
        code: 'E9',
        message: `section ${section.id} has energy ${section.energy}, outside ${RANGES.energy.min}–${RANGES.energy.max}`,
        path: ['sections', index, 'energy'],
      })
    }
  })
  score.tracks.forEach((track, index) => {
    if (outside(track.gainDb, RANGES.gainDb)) {
      errors.push({
        code: 'E9',
        message: `track ${track.id} has gain ${track.gainDb} dB, outside ${RANGES.gainDb.min}–${RANGES.gainDb.max}`,
        path: ['tracks', index, 'gainDb'],
      })
    }
    if (outside(track.pan, RANGES.pan)) {
      errors.push({
        code: 'E9',
        message: `track ${track.id} has pan ${track.pan}, outside ${RANGES.pan.min}–${RANGES.pan.max}`,
        path: ['tracks', index, 'pan'],
      })
    }
  })
  score.clips.forEach((clip, index) => {
    clip.notes.forEach((note, noteIndex) => {
      if (outside(note.pitch, RANGES.pitch) || !Number.isInteger(note.pitch)) {
        errors.push({
          code: 'E9',
          message: `note ${noteIndex} of clip ${clip.id} has pitch ${note.pitch}, outside MIDI ${RANGES.pitch.min}–${RANGES.pitch.max}`,
          path: ['clips', index, 'notes', noteIndex, 'pitch'],
        })
      }
      if (outside(note.velocity, RANGES.velocity)) {
        errors.push({
          code: 'E9',
          message: `note ${noteIndex} of clip ${clip.id} has velocity ${note.velocity}, outside ${RANGES.velocity.min}–${RANGES.velocity.max}`,
          path: ['clips', index, 'notes', noteIndex, 'velocity'],
        })
      }
    })
  })
}

function checkW1(score: Score, warnings: Finding[]): void {
  const roleById = new Map(score.tracks.map((track) => [track.id, track.role]))
  score.clips.forEach((clip, index) => {
    const role = roleById.get(clip.trackId)
    const range = role === undefined ? undefined : PITCHED_ROLE_RANGES[role]
    if (range === undefined) {
      return
    }
    clip.notes.forEach((note, noteIndex) => {
      if (outside(note.pitch, range)) {
        warnings.push({
          code: 'W1',
          message: `note ${noteIndex} of clip ${clip.id} has pitch ${note.pitch}, outside the ${role} range ${range.min}–${range.max}`,
          path: ['clips', index, 'notes', noteIndex, 'pitch'],
        })
      }
    })
  })
}

function checkW2(score: Score, warnings: Finding[]): void {
  const tracksWithClips = new Set(score.clips.map((clip) => clip.trackId))
  score.tracks.forEach((track, index) => {
    if (!tracksWithClips.has(track.id)) {
      warnings.push({
        code: 'W2',
        message: `track ${track.id} has no clip`,
        path: ['tracks', index],
      })
    }
  })
}

function checkW3(score: Score, warnings: Finding[]): void {
  const perBar = ticksPerBar(score.meter)
  score.sections.forEach((section, index) => {
    const start = section.startBar * perBar
    const end = start + section.bars * perBar
    const sounds = score.clips.some((clip) =>
      clip.notes.some((note) => {
        const at = clip.start + note.at
        return at < end && at + note.duration > start
      }),
    )
    if (!sounds) {
      warnings.push({
        code: 'W3',
        message: `section ${section.id} has no note sounding inside it`,
        path: ['sections', index],
      })
    }
  })
}

function checkW4(score: Score, warnings: Finding[]): void {
  const fxById = new Map(score.tracks.map((track) => [track.id, track.fx.map((fx) => fx.kind)]))
  score.automation.forEach((automation, index) => {
    const target = automation.target
    if (!('trackId' in target)) {
      return
    }
    const required = PARAM_REQUIRES_FX[target.param]
    if (required === undefined) {
      return
    }
    const kinds = fxById.get(target.trackId)
    if (kinds !== undefined && !kinds.includes(required)) {
      warnings.push({
        code: 'W4',
        message: `automation ${automation.id} drives ${target.param}, which track ${target.trackId} does not expose without a ${required} effect`,
        path: ['automation', index, 'target', 'param'],
      })
    }
  })
}

export function validate(score: Score): ValidationResult {
  const errors: Finding[] = []
  const warnings: Finding[] = []
  checkE1(score, errors)
  checkE2(score, errors)
  checkE3(score, errors)
  checkE4(score, errors)
  checkE5(score, errors)
  checkE6(score, errors)
  checkE7(score, errors)
  checkE8(score, errors)
  checkE9(score, errors)
  checkW1(score, warnings)
  checkW2(score, warnings)
  checkW3(score, warnings)
  checkW4(score, warnings)
  return { errors, warnings }
}
