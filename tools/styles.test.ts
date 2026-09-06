import { describe, expect, it } from 'vitest'
import { looseValues } from './styles.ts'

describe('the design system owns every value', () => {
  it('finds no colour, length, duration or font outside tokens.css', () => {
    expect(looseValues()).toEqual([])
  })
})
