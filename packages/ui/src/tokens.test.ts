import { describe, expect, it } from 'vitest'
import { colourToken, WINDOW_BACKGROUND } from '../colours.mjs'
import { contrastRatio, customProperties } from './test/contrast.ts'
import CSS from './tokens.css?raw'

const DARK = customProperties(CSS, ':root')
const LIGHT = customProperties(CSS, '[data-theme="light"]')

const TEXT_MINIMUM = 4.5
const EDGE_MINIMUM = 3

const TEXT_PAIRS = [
  ['--color-ink', '--color-surface'],
  ['--color-ink', '--color-surface-2'],
  ['--color-ink', '--color-surface-3'],
  ['--color-muted', '--color-surface'],
  ['--color-muted', '--color-surface-2'],
  ['--color-muted', '--color-surface-3'],
  ['--color-accent', '--color-surface'],
  ['--color-accent', '--color-surface-2'],
  ['--color-accent', '--color-surface-3'],
  ['--color-accent-ink', '--color-accent'],
  ['--color-accent-ink', '--color-accent-hover'],
  ['--color-accent-ink', '--color-accent-active'],
  ['--color-signal-ok', '--color-surface'],
  ['--color-signal-ok', '--color-surface-2'],
  ['--color-signal-ok', '--color-surface-3'],
  ['--color-signal-warn', '--color-surface'],
  ['--color-signal-warn', '--color-surface-2'],
  ['--color-signal-warn', '--color-surface-3'],
  ['--color-signal-error', '--color-surface'],
  ['--color-signal-error', '--color-surface-2'],
  ['--color-signal-error', '--color-surface-3'],
  ['--color-signal-error-ink', '--color-signal-error'],
] as const

const EDGE_PAIRS = [
  ['--color-line-strong', '--color-surface'],
  ['--color-line-strong', '--color-surface-2'],
  ['--color-line-strong', '--color-surface-3'],
  ['--color-accent', '--color-surface'],
  ['--color-accent', '--color-surface-2'],
  ['--color-accent', '--color-surface-3'],
] as const

function colour(theme: Record<string, string>, name: string): string {
  const value = theme[name] ?? DARK[name]
  if (!value) throw new Error(`tokens.css declares no ${name}`)
  return value
}

describe.each([
  ['dark', DARK],
  ['light', LIGHT],
])('tokens, %s theme', (_name, theme) => {
  it.each(TEXT_PAIRS)('reads %s on %s at 4.5:1 or better', (foreground, background) => {
    expect(
      contrastRatio(colour(theme, foreground), colour(theme, background)),
    ).toBeGreaterThanOrEqual(TEXT_MINIMUM)
  })

  it.each(EDGE_PAIRS)('draws %s on %s at 3:1 or better', (foreground, background) => {
    expect(
      contrastRatio(colour(theme, foreground), colour(theme, background)),
    ).toBeGreaterThanOrEqual(EDGE_MINIMUM)
  })

  it('defines every colour role the components use', () => {
    const roles = new Set([
      ...TEXT_PAIRS.flat(),
      ...EDGE_PAIRS.flat(),
      '--color-ink',
      '--color-line',
      '--color-focus',
    ])
    for (const role of roles) {
      expect(colour(theme, role)).toBeTruthy()
    }
  })
})

describe('tokens', () => {
  it('keeps the light theme in step with the dark one, role for role', () => {
    const darkColours = Object.keys(DARK).filter((name) => name.startsWith('--color-'))
    const lightColours = Object.keys(LIGHT)
    const aliased = ['--color-focus']
    expect(darkColours.filter((name) => !lightColours.includes(name))).toEqual(aliased)
  })

  it('has no text size below the thirteen-pixel floor', () => {
    const sizes = Object.entries(DARK)
      .filter(([name]) => name.startsWith('--text-'))
      .map(([, value]) => Number.parseInt(value, 10))
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(13)
  })

  it('puts space on a four-pixel base', () => {
    const spaces = Object.entries(DARK)
      .filter(([name]) => name.startsWith('--space-'))
      .map(([, value]) => Number.parseInt(value, 10))
    expect(spaces).toEqual([4, 8, 12, 16, 24, 32, 48, 64])
    for (const space of spaces) expect(space % 4).toBe(0)
  })
})

describe('reading a colour role from the tokens', () => {
  it('gives the window the dark surface the renderer paints, so the first frame does not flash', () => {
    expect(WINDOW_BACKGROUND).toBe(DARK['--color-surface'])
  })

  it('throws instead of returning nothing when the role does not exist', () => {
    expect(() => colourToken('surface-9')).toThrow('surface-9')
  })
})
