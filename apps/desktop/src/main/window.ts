import { join } from 'node:path'
import { WINDOW_BACKGROUND } from '@liminal/ui/colours'

export const WINDOW_TITLE = 'liminal'

export type WindowOptions = {
  title: string
  width: number
  height: number
  show: boolean
  backgroundColor: string
  webPreferences: {
    preload: string
    contextIsolation: boolean
    nodeIntegration: boolean
    sandbox: boolean
  }
}

export function mainWindowOptions(preloadDirectory: string): WindowOptions {
  return {
    title: WINDOW_TITLE,
    width: 1440,
    height: 900,
    show: false,
    backgroundColor: WINDOW_BACKGROUND,
    webPreferences: {
      preload: join(preloadDirectory, 'index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  }
}
