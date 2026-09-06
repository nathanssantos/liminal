import { describe, expect, it } from 'vitest'
import { actionFor, clampGain, gainForDigit } from './shortcuts.ts'

function element(tag: string, role?: string): Element {
  const node = document.createElement(tag)
  if (role) node.setAttribute('role', role)
  return node
}

const NOTHING = null
const button = element('button')
const slider = element('span', 'slider')
const combobox = element('button', 'combobox')

describe('the keys that work without the mouse', () => {
  it('plays and stops with Space when nothing is focused', () => {
    expect(actionFor(' ', NOTHING)).toEqual({ kind: 'toggle-transport' })
  })

  it('leaves Space to the button that has focus, so it does not fire twice', () => {
    expect(actionFor(' ', button)).toBeUndefined()
  })

  it('still mutes and changes the volume while a button has focus', () => {
    expect(actionFor('m', button)).toEqual({ kind: 'toggle-mute' })
    expect(actionFor('ArrowUp', button)).toEqual({ kind: 'nudge-volume', by: 1 })
    expect(actionFor('5', button)).toEqual({ kind: 'set-volume', gainDb: -30 })
  })

  it('leaves the arrows to the slider that has focus', () => {
    expect(actionFor('ArrowUp', slider)).toBeUndefined()
    expect(actionFor('ArrowDown', slider)).toBeUndefined()
  })

  it('leaves every key to the device picker, whose type-ahead owns them', () => {
    for (const key of [' ', 'm', 'ArrowUp', '5']) {
      expect(actionFor(key, combobox)).toBeUndefined()
    }
  })

  it('reads M in either case', () => {
    expect(actionFor('M', NOTHING)).toEqual({ kind: 'toggle-mute' })
    expect(actionFor('m', NOTHING)).toEqual({ kind: 'toggle-mute' })
  })

  it('ignores a key it has no business with', () => {
    expect(actionFor('k', NOTHING)).toBeUndefined()
    expect(actionFor('Escape', NOTHING)).toBeUndefined()
  })
})

describe('the volume the digits reach', () => {
  it('walks the range in six-decibel steps, zero at the bottom', () => {
    expect(gainForDigit(0)).toBe(-60)
    expect(gainForDigit(2)).toBe(-48)
    expect(gainForDigit(8)).toBe(-12)
  })

  it('never goes above the top of the range, whatever the digit', () => {
    expect(gainForDigit(9)).toBe(-6)
    expect(gainForDigit(20)).toBe(0)
  })

  it('keeps any nudge inside the range', () => {
    expect(clampGain(5)).toBe(0)
    expect(clampGain(-100)).toBe(-60)
    expect(clampGain(-12)).toBe(-12)
  })
})
