import { colourToken } from '@liminal/ui/colours'
import { describe, expect, it } from 'vitest'
import { mainWindowOptions, WINDOW_TITLE } from './window.ts'

describe('the main window', () => {
  it('is titled liminal', () => {
    expect(mainWindowOptions('/out/preload').title).toBe(WINDOW_TITLE)
  })

  it('keeps the renderer isolated from Node', () => {
    const { webPreferences } = mainWindowOptions('/out/preload')
    expect(webPreferences.contextIsolation).toBe(true)
    expect(webPreferences.nodeIntegration).toBe(false)
    expect(webPreferences.sandbox).toBe(true)
  })

  it('paints the surface the renderer paints, so the first frame does not flash', () => {
    expect(mainWindowOptions('/out/preload').backgroundColor).toBe(colourToken('surface'))
  })

  it('loads the preload bundle from the given directory', () => {
    expect(mainWindowOptions('/out/preload').webPreferences.preload).toBe('/out/preload/index.mjs')
  })
})
