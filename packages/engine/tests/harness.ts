import type { Score } from '@liminal/score'
import { OfflineAudioContext } from 'node-web-audio-api'
import type { Engine } from '../src/engine.ts'
import { createEngine } from '../src/engine.ts'
import { scoreReleaseTailSeconds } from '../src/instruments.ts'
import { scoreSeconds } from '../src/time.ts'
import { loadTone } from '../src/tone.ts'

const SAMPLE_RATE = 48000

const PAST_THE_TAIL_SECONDS = 0.25

export type Rendered = {
  engine: Engine
  render: () => Promise<AudioBuffer>
}

export async function offlineEngine(score: Score, seconds?: number): Promise<Rendered> {
  const tone = await loadTone()
  const length =
    seconds ?? scoreSeconds(score) + scoreReleaseTailSeconds(score) + PAST_THE_TAIL_SECONDS
  const raw = new OfflineAudioContext(2, Math.ceil(SAMPLE_RATE * length), SAMPLE_RATE)
  const context = new tone.OfflineContext(raw as unknown as OfflineAudioContext)
  const engine = await createEngine({ context, score })
  return { engine, render: () => context.render() as unknown as Promise<AudioBuffer> }
}

export function peakOf(buffer: AudioBuffer): number {
  let peak = 0
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel)
    for (let index = 0; index < data.length; index += 1) {
      peak = Math.max(peak, Math.abs(data[index] ?? 0))
    }
  }
  return peak
}

export function peakBetween(buffer: AudioBuffer, fromSeconds: number, toSeconds: number): number {
  const first = Math.max(0, Math.floor(fromSeconds * buffer.sampleRate))
  const last = Math.min(buffer.length, Math.ceil(toSeconds * buffer.sampleRate))
  let peak = 0
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel)
    for (let index = first; index < last; index += 1) {
      peak = Math.max(peak, Math.abs(data[index] ?? 0))
    }
  }
  return peak
}
