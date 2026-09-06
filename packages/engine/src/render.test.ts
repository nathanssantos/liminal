import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Score } from '@liminal/score'
import { barToTick, PPQ, scoreLengthTicks } from '@liminal/score'
import { sixteenBars } from '@liminal/score/fixtures'
import { OfflineAudioContext } from 'node-web-audio-api'
import { beforeAll, describe, expect, it } from 'vitest'
import { DEFAULT_SAMPLE_RATE, encodeWav, measureBasic, renderOffline } from './render.ts'
import type { EngineContext } from './tone.ts'

const SECONDS_PER_MINUTE = 60

const createContext = (channels: number, length: number, sampleRate: number): EngineContext =>
  new OfflineAudioContext(channels, length, sampleRate) as unknown as EngineContext

const renderFixture = () => renderOffline({ score: sixteenBars, createContext })

const twoBars = (): Score => {
  const score = structuredClone(sixteenBars)
  const section = score.sections[0]
  if (section !== undefined) {
    section.bars = 2
  }
  score.clips = score.clips.map((clip) => ({
    ...clip,
    length: barToTick(2, score.meter),
    notes: clip.notes.filter((note) => note.at < barToTick(2, score.meter)),
  }))
  score.automation = []
  return score
}

const renderTwoBars = () => renderOffline({ score: twoBars(), createContext })

const ffprobeDuration = (wav: Uint8Array): number | undefined => {
  const path = join(mkdtempSync(join(tmpdir(), 'liminal-wav-')), 'render.wav')
  writeFileSync(path, wav)
  try {
    const out = execFileSync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
      { encoding: 'utf8' },
    )
    return Number.parseFloat(out.trim())
  } catch {
    return undefined
  }
}

describe('renderOffline turns a document into samples', () => {
  let rendered: Awaited<ReturnType<typeof renderFixture>>

  beforeAll(async () => {
    rendered = await renderFixture()
  })

  it('renders the length the document asks for, within a sample', () => {
    const expected =
      (scoreLengthTicks(sixteenBars) / PPQ) * (SECONDS_PER_MINUTE / sixteenBars.tempo.bpm)
    expect(rendered.durationSec * rendered.sampleRate).toBeCloseTo(
      expected * rendered.sampleRate,
      0,
    )
    expect(rendered.sampleRate).toBe(DEFAULT_SAMPLE_RATE)
    expect(rendered.channels).toHaveLength(2)
  })

  it('stays under full scale and is not silence', () => {
    const measured = measureBasic(rendered.channels)
    expect(measured.peak).toBeLessThanOrEqual(1)
    expect(measured.rms).toBeGreaterThan(0.01)
    expect(measured.silent).toBe(false)
  })

  it('renders the same document twice into the same samples', async () => {
    const first = await renderTwoBars()
    const again = await renderTwoBars()
    expect(again.channels).toHaveLength(first.channels.length)
    for (let channel = 0; channel < first.channels.length; channel += 1) {
      expect(again.channels[channel]).toEqual(first.channels[channel])
    }
  })

  it('ignores the seed, which writes notes rather than playing them', async () => {
    const first = await renderTwoBars()
    const reseeded = twoBars()
    reseeded.seed = reseeded.seed + 1
    const other = await renderOffline({ score: reseeded, createContext })
    for (let channel = 0; channel < first.channels.length; channel += 1) {
      expect(other.channels[channel]).toEqual(first.channels[channel])
    }
  })
})

describe('encodeWav writes a file a decoder can read', () => {
  it('writes a RIFF header that names the format the samples are in', () => {
    const channels = [Float32Array.from([0, 0.5, -0.5]), Float32Array.from([0, -0.5, 0.5])]
    const wav = encodeWav(channels, DEFAULT_SAMPLE_RATE)
    const view = new DataView(wav.buffer)
    const text = (offset: number) => String.fromCharCode(...wav.slice(offset, offset + 4))

    expect(text(0)).toBe('RIFF')
    expect(text(8)).toBe('WAVE')
    expect(text(12)).toBe('fmt ')
    expect(text(36)).toBe('data')
    expect(view.getUint16(22, true)).toBe(2)
    expect(view.getUint32(24, true)).toBe(DEFAULT_SAMPLE_RATE)
    expect(view.getUint16(34, true)).toBe(16)
    expect(view.getUint32(40, true)).toBe(3 * 2 * 2)
    expect(view.getUint32(4, true)).toBe(wav.length - 8)
    expect(wav.length).toBe(44 + 3 * 2 * 2)
  })

  it('refuses channels of different lengths rather than writing a torn file', () => {
    expect(() => encodeWav([new Float32Array(4), new Float32Array(3)], 48000)).toThrow(
      /same length/,
    )
  })

  it('carries the duration the render had, read back from the file', async () => {
    const rendered = await renderTwoBars()
    const wav = encodeWav(rendered.channels, rendered.sampleRate)
    const view = new DataView(wav.buffer)
    const frames = view.getUint32(40, true) / (2 * 2)

    expect(frames / rendered.sampleRate).toBeCloseTo(rendered.durationSec, 6)

    const probed = ffprobeDuration(wav)
    if (probed === undefined) {
      process.stdout.write('ffprobe not installed: the wav duration is checked from the header\n')
      return
    }
    expect(probed).toBeCloseTo(rendered.durationSec, 2)
  })
})

describe('measureBasic says whether anything is there', () => {
  it('calls a buffer of zeroes silent', () => {
    const measured = measureBasic([new Float32Array(128)])
    expect(measured.silent).toBe(true)
    expect(measured.peak).toBe(0)
    expect(measured.rms).toBe(0)
  })

  it('reads the peak and the rms of a full-scale square', () => {
    const measured = measureBasic([Float32Array.from([1, -1, 1, -1])])
    expect(measured.peak).toBe(1)
    expect(measured.rms).toBeCloseTo(1, 6)
    expect(measured.silent).toBe(false)
  })
})
