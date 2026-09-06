import type { Score, Tick } from '@liminal/score'
import { PPQ, scoreLengthTicks, ticksPerBar } from '@liminal/score'

const SECONDS_PER_MINUTE = 60

export function ticksToSeconds(tick: Tick, bpm: number): number {
  return (tick / PPQ) * (SECONDS_PER_MINUTE / bpm)
}

export function secondsToTicks(seconds: number, bpm: number): Tick {
  return Math.round((seconds * bpm * PPQ) / SECONDS_PER_MINUTE)
}

export function barSeconds(score: Score): number {
  return ticksToSeconds(ticksPerBar(score.meter), score.tempo.bpm)
}

export function scoreSeconds(score: Score): number {
  return ticksToSeconds(scoreLengthTicks(score), score.tempo.bpm)
}
