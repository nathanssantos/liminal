import { OUTPUT_GAIN_DB } from '@liminal/protocol'

export type ShortcutAction =
  | { kind: 'toggle-transport' }
  | { kind: 'toggle-mute' }
  | { kind: 'nudge-volume'; by: number }
  | { kind: 'set-volume'; gainDb: number }

const DIGIT = /^[0-9]$/
const GAIN_PER_DIGIT = 6

export function gainForDigit(digit: number): number {
  return Math.min(OUTPUT_GAIN_DB.max, OUTPUT_GAIN_DB.min + digit * GAIN_PER_DIGIT)
}

function isSlider(focused: Element | null): boolean {
  return focused?.getAttribute('role') === 'slider'
}

function isNativeButton(focused: Element | null): boolean {
  return focused?.tagName === 'BUTTON' && focused.getAttribute('role') !== 'combobox'
}

function isCombobox(focused: Element | null): boolean {
  return focused?.getAttribute('role') === 'combobox'
}

export function actionFor(key: string, focused: Element | null): ShortcutAction | undefined {
  if (isCombobox(focused)) return undefined
  if (key === ' ') {
    if (isNativeButton(focused)) return undefined
    return { kind: 'toggle-transport' }
  }
  if (key === 'm' || key === 'M') return { kind: 'toggle-mute' }
  if (key === 'ArrowUp' || key === 'ArrowDown') {
    if (isSlider(focused)) return undefined
    return { kind: 'nudge-volume', by: key === 'ArrowUp' ? 1 : -1 }
  }
  if (DIGIT.test(key)) return { kind: 'set-volume', gainDb: gainForDigit(Number(key)) }
  return undefined
}

export function clampGain(gainDb: number): number {
  return Math.min(OUTPUT_GAIN_DB.max, Math.max(OUTPUT_GAIN_DB.min, gainDb))
}
