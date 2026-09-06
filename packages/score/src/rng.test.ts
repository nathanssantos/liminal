import { describe, expect, it } from 'vitest'
import { createRng, newId } from './rng.ts'

const CROCKFORD = /^[0-9A-HJKMNP-TV-Z]{26}$/

const draw = (seed: number, count: number) => {
  const rng = createRng(seed)
  return Array.from({ length: count }, () => rng.next())
}

describe('createRng', () => {
  it('yields the same 1000 numbers on two runs and a different sequence from another seed', () => {
    expect(draw(42, 1000)).toEqual(draw(42, 1000))
    expect(draw(42, 1000)).not.toEqual(draw(43, 1000))
  })

  it('stays inside [0, 1)', () => {
    for (const value of draw(7, 5000)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('does not collapse on seed 0, which is xorshift32 fixed point', () => {
    const values = draw(0, 100)
    expect(new Set(values).size).toBeGreaterThan(1)
  })

  it('keeps int(max) below max and pick inside the array', () => {
    const rng = createRng(99)
    const items = ['a', 'b', 'c'] as const
    for (let index = 0; index < 1000; index += 1) {
      expect(rng.int(4)).toBeLessThan(4)
      expect(items).toContain(rng.pick(items))
    }
  })

  it('refuses an empty array and a max below 1', () => {
    const rng = createRng(1)
    expect(() => rng.pick([])).toThrow(RangeError)
    expect(() => rng.int(0)).toThrow(RangeError)
  })
})

describe('newId', () => {
  it('writes 26 characters of the Crockford base32 alphabet', () => {
    const rng = createRng(2026)
    for (let index = 0; index < 500; index += 1) {
      expect(newId(rng)).toMatch(CROCKFORD)
    }
  })

  it('gives the same ids for the same seed and different ids within one stream', () => {
    const first = createRng(5)
    const second = createRng(5)
    const ids = Array.from({ length: 200 }, () => newId(first))
    expect(ids).toEqual(Array.from({ length: 200 }, () => newId(second)))
    expect(new Set(ids).size).toBe(ids.length)
  })
})
