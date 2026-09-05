import { PPQ } from '@liminal/score'
import { describe, expect, it } from 'vitest'
import { COMMIT_HORIZON_BARS, MIN_HORIZON_BARS, PHRASE_BARS } from './index.ts'

describe('@liminal/conductor', () => {
  it('keeps the commit horizon above the minimum horizon', () => {
    expect(COMMIT_HORIZON_BARS).toBeGreaterThan(MIN_HORIZON_BARS)
  })

  it('aligns both horizons to whole phrases', () => {
    expect(MIN_HORIZON_BARS % PHRASE_BARS).toBe(0)
    expect(COMMIT_HORIZON_BARS % PHRASE_BARS).toBe(0)
  })

  it('resolves @liminal/score across the workspace', () => {
    expect(PPQ).toBe(960)
  })
})
