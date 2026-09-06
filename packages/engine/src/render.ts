import type { Score } from '@liminal/score'
import { createEngine } from './engine.ts'
import { EngineError } from './errors.ts'
import { scoreSeconds } from './time.ts'
import type { EngineContext } from './tone.ts'
import { loadTone, rendersOffline, rendersToneOffline, wrapContext } from './tone.ts'

export const DEFAULT_SAMPLE_RATE = 48000

const CHANNELS = 2

const BITS_PER_SAMPLE = 16

const BYTES_PER_SAMPLE = BITS_PER_SAMPLE / 8

const RIFF_HEADER_BYTES = 44

const FULL_SCALE = 32767

export type CreateOfflineContext = (
  channels: number,
  length: number,
  sampleRate: number,
) => EngineContext

export type RenderOptions = {
  score: Score
  sampleRate?: number
  createContext: CreateOfflineContext
}

export type Render = {
  channels: Float32Array[]
  sampleRate: number
  durationSec: number
}

export type BasicMeasurement = {
  peak: number
  rms: number
  silent: boolean
}

const SILENCE_PEAK = 1e-4

export async function renderOffline(options: RenderOptions): Promise<Render> {
  const sampleRate = options.sampleRate ?? DEFAULT_SAMPLE_RATE
  const durationSec = scoreSeconds(options.score)
  const length = Math.round(durationSec * sampleRate)
  const raw = options.createContext(CHANNELS, length, sampleRate)
  if (!rendersOffline(raw)) {
    throw new EngineError(
      'context-not-offline',
      'renderOffline needs a context that renders offline, and this one plays live',
    )
  }
  const tone = await loadTone()
  const { context } = wrapContext(tone, raw)
  if (!rendersToneOffline(context)) {
    throw new EngineError(
      'context-not-offline',
      'this context was wrapped as a live one, so its transport would never advance',
    )
  }
  const engine = await createEngine({ context, score: options.score })
  let buffer: AudioBuffer
  try {
    engine.play()
    buffer = (await context.render()) as unknown as AudioBuffer
  } finally {
    engine.dispose()
  }
  return {
    channels: Array.from({ length: buffer.numberOfChannels }, (_, channel) =>
      Float32Array.from(buffer.getChannelData(channel)),
    ),
    sampleRate: buffer.sampleRate,
    durationSec: buffer.length / buffer.sampleRate,
  }
}

export function measureBasic(channels: readonly Float32Array[]): BasicMeasurement {
  let peak = 0
  let sum = 0
  let count = 0
  for (const data of channels) {
    for (let index = 0; index < data.length; index += 1) {
      const sample = data[index] ?? 0
      peak = Math.max(peak, Math.abs(sample))
      sum += sample * sample
      count += 1
    }
  }
  return {
    peak,
    rms: count === 0 ? 0 : Math.sqrt(sum / count),
    silent: peak < SILENCE_PEAK,
  }
}

export function encodeWav(channels: readonly Float32Array[], sampleRate: number): Uint8Array {
  if (channels.length === 0) {
    throw new EngineError('invalid-audio', 'a wav needs at least one channel')
  }
  const frames = channels[0]?.length ?? 0
  for (const data of channels) {
    if (data.length !== frames) {
      throw new EngineError('invalid-audio', 'every channel of a wav has the same length')
    }
  }
  const dataBytes = frames * channels.length * BYTES_PER_SAMPLE
  const bytes = new Uint8Array(RIFF_HEADER_BYTES + dataBytes)
  const view = new DataView(bytes.buffer)
  const ascii = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index += 1) {
      bytes[offset + index] = text.charCodeAt(index)
    }
  }
  ascii(0, 'RIFF')
  view.setUint32(4, RIFF_HEADER_BYTES - 8 + dataBytes, true)
  ascii(8, 'WAVE')
  ascii(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channels.length, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * channels.length * BYTES_PER_SAMPLE, true)
  view.setUint16(32, channels.length * BYTES_PER_SAMPLE, true)
  view.setUint16(34, BITS_PER_SAMPLE, true)
  ascii(36, 'data')
  view.setUint32(40, dataBytes, true)
  let offset = RIFF_HEADER_BYTES
  for (let frame = 0; frame < frames; frame += 1) {
    for (const data of channels) {
      const sample = Math.max(-1, Math.min(1, data[frame] ?? 0))
      view.setInt16(offset, Math.round(sample * FULL_SCALE), true)
      offset += BYTES_PER_SAMPLE
    }
  }
  return bytes
}
