import type { Bar, Score, Section, Tick } from './schema.ts'
import { PPQ } from './schema.ts'

export type TimeSignature = { beatsPerBar: number; beatUnit: number }

export type Position = { bar: Bar; beat: number; tick: Tick }

export function ticksPerBeat(meter: TimeSignature): number {
  const ticks = (PPQ * 4) / meter.beatUnit
  if (!Number.isInteger(ticks)) {
    throw new RangeError(`a beat unit of ${meter.beatUnit} does not divide ${PPQ * 4} ticks`)
  }
  return ticks
}

export function ticksPerBar(meter: TimeSignature): number {
  return ticksPerBeat(meter) * meter.beatsPerBar
}

export function barToTick(bar: Bar, meter: TimeSignature): Tick {
  return bar * ticksPerBar(meter)
}

export function tickToPosition(tick: Tick, meter: TimeSignature): Position {
  const perBar = ticksPerBar(meter)
  const perBeat = ticksPerBeat(meter)
  const bar = Math.floor(tick / perBar)
  const withinBar = tick - bar * perBar
  return {
    bar,
    beat: Math.floor(withinBar / perBeat),
    tick: withinBar % perBeat,
  }
}

export function scoreLengthBars(score: Score): number {
  return score.sections.reduce((total, section) => total + section.bars, 0)
}

export function scoreLengthTicks(score: Score): Tick {
  return barToTick(scoreLengthBars(score), score.meter)
}

export function sectionAt(score: Score, tick: Tick): Section | undefined {
  const perBar = ticksPerBar(score.meter)
  return score.sections.find((section) => {
    const start = section.startBar * perBar
    return tick >= start && tick < start + section.bars * perBar
  })
}
