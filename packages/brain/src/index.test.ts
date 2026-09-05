import { PPQ } from '@liminal/score'
import { describe, expect, it } from 'vitest'

describe('@liminal/brain', () => {
  it('resolves @liminal/score across the workspace', () => {
    expect(PPQ).toBe(960)
  })
})
