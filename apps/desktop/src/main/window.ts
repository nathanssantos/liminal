import { join } from 'node:path'

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
    backgroundColor: '#0b0b0f',
    webPreferences: {
      preload: join(preloadDirectory, 'index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  }
}
