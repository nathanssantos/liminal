import { PPQ } from '@liminal/score'
import { describe, expect, it } from 'vitest'
import { absoluteTick, beatOf, decibels, elapsedMsAt } from './store.ts'

describe('the volume value', () => {
  it('writes a real minus sign, not a hyphen', () => {
    expect(decibels(-12)).toBe('−12 dB')
    expect(decibels(-12).charCodeAt(0)).toBe(0x2212)
  })

  it('says silence at the bottom of the range in a word speech can read', () => {
    expect(decibels(-60)).toBe('silent')
    expect(decibels(-60)).not.toContain('∞')
  })

  it('writes the top of the range without a sign', () => {
    expect(decibels(0)).toBe('0 dB')
  })
})

describe('how much of the set has been heard', () => {
  const meter = { beatsPerBar: 4, beatUnit: 4 } as const

  it('counts every bar and beat already played, not just the current beat', () => {
    const oneBarIn = absoluteTick({ bar: 1, beat: 0, tick: 0 }, meter)
    expect(oneBarIn).toBe(PPQ * meter.beatsPerBar)
    expect(elapsedMsAt(oneBarIn, 128)).toBeCloseTo(1875, 0)
  })

  it('does not report zero once a beat has passed', () => {
    const threeBeatsIn = absoluteTick({ bar: 0, beat: 3, tick: 0 }, meter)
    expect(elapsedMsAt(threeBeatsIn, 128)).toBeGreaterThan(1000)
  })

  it('is zero only at the very start', () => {
    expect(elapsedMsAt(absoluteTick({ bar: 0, beat: 0, tick: 0 }, meter), 128)).toBe(0)
  })
})

describe('the beat the transport chip ticks on', () => {
  const score = { meter: { beatsPerBar: 4 } } as never

  it('counts beats since the start, so it changes once a beat and not once a bar', () => {
    expect(beatOf({ score, position: { bar: 0, beat: 0, tick: 0 } })).toBe(0)
    expect(beatOf({ score, position: { bar: 0, beat: 3, tick: 0 } })).toBe(3)
    expect(beatOf({ score, position: { bar: 1, beat: 0, tick: 0 } })).toBe(4)
    expect(beatOf({ score, position: { bar: 2, beat: 2, tick: 0 } })).toBe(10)
  })

  it('does not tick before a set is loaded', () => {
    expect(beatOf({ score: undefined, position: { bar: 3, beat: 1, tick: 0 } })).toBe(0)
  })
})
