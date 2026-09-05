import { describe, expect, it } from 'vitest'
import { PPQ, SCORE_VERSION } from './index.ts'

describe('@liminal/score', () => {
  it('fixes 960 ticks per quarter note', () => {
    expect(PPQ).toBe(960)
  })

  it('declares the schema version the document carries', () => {
    expect(SCORE_VERSION).toBe(1)
  })
})
