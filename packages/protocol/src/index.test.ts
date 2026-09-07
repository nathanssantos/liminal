import { PPQ } from '@liminal/score'
import { sixteenBars } from '@liminal/score/fixtures'
import { describe, expect, it } from 'vitest'
import {
  CHANNELS,
  OUTPUT_GAIN_DB,
  outputDevice,
  outputMute,
  outputVolume,
  SAFE_OUTPUT_GAIN_DB,
  scoreLoad,
  transportPosition,
} from './index.ts'

describe('@liminal/protocol', () => {
  it('resolves @liminal/score across the workspace', () => {
    expect(PPQ).toBe(960)
  })

  it('names every channel once', () => {
    const names = CHANNELS.map((channel) => channel.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('carries a document on score:load, and refuses one whose shape is wrong', () => {
    expect(scoreLoad.input.safeParse(sixteenBars).success).toBe(true)
    expect(scoreLoad.input.safeParse({ ...sixteenBars, tempo: { bpm: 'fast' } }).success).toBe(
      false,
    )
    expect(scoreLoad.input.safeParse({ ...sixteenBars, extra: 1 }).success).toBe(false)
  })

  it('leaves legality to validate, as ADR-0009 says: the channel only checks shape', () => {
    expect(scoreLoad.input.safeParse({ ...sixteenBars, tempo: { bpm: 0 } }).success).toBe(true)
  })

  it('refuses a position that is not whole bars, beats and ticks', () => {
    expect(transportPosition.input.safeParse({ bar: 4, beat: 0, tick: 0 }).success).toBe(true)
    expect(transportPosition.input.safeParse({ bar: 4.5, beat: 0, tick: 0 }).success).toBe(false)
    expect(transportPosition.input.safeParse({ bar: -1, beat: 0, tick: 0 }).success).toBe(false)
    expect(transportPosition.input.safeParse({ bar: 4, beat: 0 }).success).toBe(false)
  })

  it('holds the output gain inside the range the slider offers', () => {
    expect(outputVolume.input.safeParse({ gainDb: SAFE_OUTPUT_GAIN_DB }).success).toBe(true)
    expect(outputVolume.input.safeParse({ gainDb: OUTPUT_GAIN_DB.min }).success).toBe(true)
    expect(outputVolume.input.safeParse({ gainDb: OUTPUT_GAIN_DB.max }).success).toBe(true)
    expect(outputVolume.input.safeParse({ gainDb: OUTPUT_GAIN_DB.max + 1 }).success).toBe(false)
    expect(outputVolume.input.safeParse({ gainDb: OUTPUT_GAIN_DB.min - 1 }).success).toBe(false)
  })

  it('starts at a level that cannot hurt, well under the top of the range', () => {
    expect(SAFE_OUTPUT_GAIN_DB).toBeLessThan(OUTPUT_GAIN_DB.max)
    expect(SAFE_OUTPUT_GAIN_DB).toBeGreaterThan(OUTPUT_GAIN_DB.min)
  })

  it('refuses a mute that is not a boolean, rather than coercing it', () => {
    expect(outputMute.input.safeParse({ muted: true }).success).toBe(true)
    expect(outputMute.input.safeParse({ muted: 'true' }).success).toBe(false)
    expect(outputMute.input.safeParse({}).success).toBe(false)
  })

  it('answers the device channel with the list and the chosen one', () => {
    const answer = { devices: [{ id: 'default', label: 'System' }], selected: 'default' }
    expect(outputDevice.output.safeParse(answer).success).toBe(true)
    expect(outputDevice.output.safeParse({ devices: [], selected: 'default' }).success).toBe(true)
    expect(outputDevice.output.safeParse({ devices: [{ id: 'a' }] }).success).toBe(false)
  })

  it('refuses a field the schema does not name, in both directions', () => {
    expect(outputVolume.input.safeParse({ gainDb: -12, extra: 1 }).success).toBe(false)
    expect(outputDevice.output.safeParse({ devices: [], selected: 'a', extra: 1 }).success).toBe(
      false,
    )
  })
})
