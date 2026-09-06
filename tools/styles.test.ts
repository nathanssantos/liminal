import { describe, expect, it } from 'vitest'
import { looseValues, looseValuesInLine, scannedFiles } from './styles.ts'

describe('the design system owns every value', () => {
  it('sweeps both trees, wherever it is run from', () => {
    const files = scannedFiles()
    expect(files.length).toBeGreaterThan(10)
    expect(files.some((path) => path.startsWith('packages/ui/src/'))).toBe(true)
    expect(files.some((path) => path.startsWith('apps/desktop/src/'))).toBe(true)
    expect(files).not.toContain('packages/ui/src/tokens.css')
  })

  it('finds no colour, length, duration or font outside tokens.css', () => {
    expect(looseValues()).toEqual([])
  })

  it('lets a breakpoint keep its pixels, because a media query cannot read a variable', () => {
    expect(looseValuesInLine('@media (min-width: 1440px) {')).toEqual([])
  })

  it('still catches a colour, a duration and a font inside a media query', () => {
    expect(looseValuesInLine('@media (min-width: 1024px) { .x { color: #123456 } }')).toEqual([
      'a colour',
    ])
    expect(looseValuesInLine('@media print { .x { transition-duration: 200ms } }')).toEqual([
      'a duration',
    ])
    expect(looseValuesInLine('@media print { .x { font-family: Helvetica } }')).toEqual(['a font'])
  })

  it('catches a colour and a length in ordinary code', () => {
    expect(looseValuesInLine('  color: #0e1114;')).toEqual(['a colour'])
    expect(looseValuesInLine('  height: 36px;')).toEqual(['a length'])
  })
})
