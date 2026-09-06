import { PPQ } from '@liminal/score'
import { describe, expect, it } from 'vitest'
import { absoluteTick, decibels, elapsedMsAt, gainForDigit, readout } from './store.ts'

describe('the readout', () => {
  it('is one-based and never reads zero', () => {
    expect(readout({ bar: 0, beat: 0, tick: 0 })).toBe('01:1')
  })

  it('pads the bar to two digits, so the line does not shift at bar ten', () => {
    expect(readout({ bar: 8, beat: 3, tick: 0 })).toBe('09:4')
    expect(readout({ bar: 9, beat: 0, tick: 0 })).toBe('10:1')
    expect(readout({ bar: 0, beat: 0, tick: 0 })).toHaveLength(
      readout({ bar: 9, beat: 0, tick: 0 }).length,
    )
  })
})

describe('the volume value', () => {
  it('writes a real minus sign, not a hyphen', () => {
    expect(decibels(-12)).toBe('−12 dB')
    expect(decibels(-12).charCodeAt(0)).toBe(0x2212)
  })

  it('says silence at the bottom of the range rather than a number', () => {
    expect(decibels(-60)).toBe('−∞ dB')
  })

  it('writes the top of the range without a sign', () => {
    expect(decibels(0)).toBe('0 dB')
  })
})

describe('the number keys', () => {
  it('map nine to well under the top of the range', () => {
    expect(gainForDigit(9)).toBe(-6)
  })

  it('map zero to silence and five to the middle', () => {
    expect(gainForDigit(0)).toBe(-60)
    expect(gainForDigit(5)).toBe(-30)
  })

  it('cannot reach full output, whichever key is pressed', () => {
    const reachable = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(gainForDigit)
    expect(Math.max(...reachable)).toBeLessThan(0)
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
