import { PARAM_REQUIRES_FX, PITCHED_ROLE_RANGES, RANGES } from './constants.ts'
import type { Clip, Score } from './schema.ts'
import { PPQ } from './schema.ts'
import { scoreLengthTicks, ticksPerBar } from './time.ts'

const TICKS_PER_WHOLE_NOTE = PPQ * 4

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

function at<T>(items: readonly T[], index: number): T {
  const item = items[index]
  if (item === undefined) {
    throw new RangeError(`index ${index} is outside an array of ${items.length}`)
  }
  return item
}

function* consecutivePairs<T>(
  items: readonly T[],
): Generator<{ previous: T; current: T; index: number }> {
  for (let index = 1; index < items.length; index += 1) {
    yield { previous: at(items, index - 1), current: at(items, index), index }
  }
}

function checkWholeNumbers(score: Score, errors: Finding[]): void {
  if (!isWholeAtLeast(score.meter.beatsPerBar, 1)) {
    errors.push({
      code: 'E1',
      message: `score ${score.id} has ${score.meter.beatsPerBar} beats per bar, which is not a whole number ≥ 1`,
      path: ['meter', 'beatsPerBar'],
    })
  }
  if (!isWholeAtLeast(score.meter.beatUnit, 1)) {
    errors.push({
      code: 'E1',
      message: `score ${score.id} has a beat unit of ${score.meter.beatUnit}, which is not a whole number ≥ 1`,
      path: ['meter', 'beatUnit'],
    })
  }
  if (!isWholeAtLeast(score.seed, 0)) {
    errors.push({
      code: 'E1',
      message: `score ${score.id} has seed ${score.seed}, which is not a whole number ≥ 0`,
      path: ['seed'],
    })
  }
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
      if (!isWholeAtLeast(note.pitch, 0)) {
        errors.push({
          code: 'E1',
          message: `note ${noteIndex} of clip ${clip.id} has pitch ${note.pitch}, which is not a whole MIDI number`,
          path: ['clips', index, 'notes', noteIndex, 'pitch'],
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

function checkContiguousSections(score: Score, errors: Finding[]): void {
  if (score.sections.length === 0) {
    errors.push({
      code: 'E2',
      message: `score ${score.id} has no section, so it has no length`,
      path: ['sections'],
    })
  }
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

function checkUniqueIds(score: Score, errors: Finding[]): void {
  const collections = [
    ['sections', score.sections],
    ['tracks', score.tracks],
    ['clips', score.clips],
    ['automation', score.automation],
  ] as const
  for (const [name, items] of collections) {
    const seen = new Set<string>()
    items.forEach((item, index) => {
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

function checkTrackReferences(score: Score, errors: Finding[]): void {
  const trackIds = new Set(score.tracks.map((track) => track.id))
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

function checkClipsInsideScore(score: Score, errors: Finding[]): void {
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

function checkNotesInsideClip(score: Score, errors: Finding[]): void {
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

function checkClipsDoNotOverlap(score: Score, errors: Finding[]): void {
  const byTrack = new Map<string, { clip: Clip; index: number }[]>()
  score.clips.forEach((clip, index) => {
    const placed = byTrack.get(clip.trackId) ?? []
    placed.push({ clip, index })
    byTrack.set(clip.trackId, placed)
  })
  for (const [trackId, placed] of byTrack) {
    const ordered = placed.toSorted((left, right) => left.clip.start - right.clip.start)
    for (const { previous, current } of consecutivePairs(ordered)) {
      if (current.clip.start < previous.clip.start + previous.clip.length) {
        errors.push({
          code: 'E7',
          message: `clips ${previous.clip.id} and ${current.clip.id} overlap on track ${trackId}`,
          path: ['clips', current.index],
        })
      }
    }
  }
}

function checkAscendingAutomation(score: Score, errors: Finding[]): void {
  score.automation.forEach((automation, index) => {
    for (const { previous, current, index: pointIndex } of consecutivePairs(automation.points)) {
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
  return !Number.isFinite(value) || value < range.min || value > range.max
}

function checkRanges(score: Score, errors: Finding[]): void {
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
  if (outside(score.seed, RANGES.seed)) {
    errors.push({
      code: 'E9',
      message: `score ${score.id} has seed ${score.seed}, outside ${RANGES.seed.min}–${RANGES.seed.max}`,
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
  score.tracks.forEach((track, index) => {
    for (const [name, value] of Object.entries(track.instrument.params ?? {})) {
      if (!Number.isFinite(value)) {
        errors.push({
          code: 'E9',
          message: `track ${track.id} sets instrument parameter ${name} to ${value}, which is not a finite number`,
          path: ['tracks', index, 'instrument', 'params', name],
        })
      }
    }
    track.fx.forEach((effect, fxIndex) => {
      for (const [name, value] of Object.entries(effect.params)) {
        if (!Number.isFinite(value)) {
          errors.push({
            code: 'E9',
            message: `track ${track.id} sets ${effect.kind} parameter ${name} to ${value}, which is not a finite number`,
            path: ['tracks', index, 'fx', fxIndex, 'params', name],
          })
        }
      }
    })
  })
  score.automation.forEach((automation, index) => {
    automation.points.forEach((point, pointIndex) => {
      if (!Number.isFinite(point.value)) {
        errors.push({
          code: 'E9',
          message: `automation ${automation.id} sets point ${pointIndex} to ${point.value}, which is not a finite number`,
          path: ['automation', index, 'points', pointIndex, 'value'],
        })
      }
    })
  })
  score.clips.forEach((clip, index) => {
    clip.notes.forEach((note, noteIndex) => {
      if (outside(note.pitch, RANGES.pitch)) {
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

function warnPitchOutsideRoleRange(score: Score, warnings: Finding[]): void {
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

function warnTrackWithoutClip(score: Score, warnings: Finding[]): void {
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

function warnSilentSection(score: Score, warnings: Finding[]): void {
  const perBar = ticksPerBar(score.meter)
  const spans = score.clips
    .flatMap((clip) =>
      clip.notes.map((note) => ({
        from: clip.start + note.at,
        to: clip.start + note.at + note.duration,
      })),
    )
    .filter((span) => Number.isFinite(span.from) && Number.isFinite(span.to))
    .toSorted((left, right) => left.from - right.from)
  const latestEnd: number[] = []
  let running = Number.NEGATIVE_INFINITY
  for (const span of spans) {
    running = Math.max(running, span.to)
    latestEnd.push(running)
  }
  score.sections.forEach((section, index) => {
    const start = section.startBar * perBar
    const end = start + section.bars * perBar
    const startingBefore = countStartingBefore(spans, end)
    const sounds = startingBefore > 0 && at(latestEnd, startingBefore - 1) > start
    if (!sounds) {
      warnings.push({
        code: 'W3',
        message: `section ${section.id} has no note sounding inside it`,
        path: ['sections', index],
      })
    }
  })
}

function countStartingBefore(spans: readonly { from: number }[], limit: number): number {
  let low = 0
  let high = spans.length
  while (low < high) {
    const middle = (low + high) >> 1
    if (at(spans, middle).from < limit) {
      low = middle + 1
    } else {
      high = middle
    }
  }
  return low
}

function warnUnexposedAutomation(score: Score, warnings: Finding[]): void {
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

function hasMeasurableBars(score: Score): boolean {
  return (
    isWholeAtLeast(score.meter.beatsPerBar, 1) &&
    isWholeAtLeast(score.meter.beatUnit, 1) &&
    Number.isInteger(TICKS_PER_WHOLE_NOTE / score.meter.beatUnit)
  )
}

export function validate(score: Score): ValidationResult {
  const errors: Finding[] = []
  const warnings: Finding[] = []
  checkWholeNumbers(score, errors)
  checkContiguousSections(score, errors)
  checkUniqueIds(score, errors)
  checkTrackReferences(score, errors)
  checkNotesInsideClip(score, errors)
  checkClipsDoNotOverlap(score, errors)
  checkAscendingAutomation(score, errors)
  checkRanges(score, errors)
  warnPitchOutsideRoleRange(score, warnings)
  warnTrackWithoutClip(score, warnings)
  warnUnexposedAutomation(score, warnings)
  if (hasMeasurableBars(score)) {
    checkClipsInsideScore(score, errors)
    warnSilentSection(score, warnings)
  }
  return { errors, warnings }
}
