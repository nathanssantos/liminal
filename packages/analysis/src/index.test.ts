import { PPQ } from '@liminal/score'
import { describe, expect, it } from 'vitest'
import { STYLE_CARD_VERSION } from './index.ts'

describe('@liminal/analysis', () => {
  it('declares the style card version', () => {
    expect(STYLE_CARD_VERSION).toBe(1)
  })

  it('resolves @liminal/score across the workspace', () => {
    expect(PPQ).toBe(960)
  })
})
