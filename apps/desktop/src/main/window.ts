import { join } from 'node:path'
import { WINDOW_BACKGROUND } from '@liminal/ui/colours'

export const WINDOW_TITLE = 'liminal'

const POLICY = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "media-src 'self'",
]

const HOT_RELOAD_NEEDS = "connect-src 'self' ws://localhost:* http://localhost:*"

export const CONTENT_SECURITY_POLICY = [...POLICY, "connect-src 'self'"].join('; ')

export const DEV_CONTENT_SECURITY_POLICY = [...POLICY, HOT_RELOAD_NEEDS].join('; ')

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

export const policyHeaderFor = (
  responseHeaders: Record<string, string[]> | undefined,
): Record<string, string[]> => ({
  ...responseHeaders,
  'Content-Security-Policy': [CONTENT_SECURITY_POLICY],
})
