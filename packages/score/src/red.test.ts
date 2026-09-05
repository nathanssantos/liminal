import { describe, expect, it } from 'vitest'
import { PPQ } from './index.ts'

describe('a deliberately broken test', () => {
  it('proves the pull request turns red', () => {
    expect(PPQ).toBe(1)
  })
})
