import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { colourToken } from '@liminal/ui/colours'
import { describe, expect, it } from 'vitest'
import {
  CONTENT_SECURITY_POLICY,
  DEV_CONTENT_SECURITY_POLICY,
  mainWindowOptions,
  policyHeaderFor,
  WINDOW_TITLE,
} from './window.ts'

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
    expect(mainWindowOptions('/out/preload').webPreferences.preload).toBe('/out/preload/index.cjs')
  })
})

describe('the content security policy', () => {
  it('allows nothing by default, and only the app itself for what it needs', () => {
    expect(CONTENT_SECURITY_POLICY).toContain("default-src 'none'")
    expect(CONTENT_SECURITY_POLICY).toContain("script-src 'self'")
    expect(CONTENT_SECURITY_POLICY).toContain("connect-src 'self'")
  })

  it('never allows eval, a remote origin or a wildcard in what ships', () => {
    expect(CONTENT_SECURITY_POLICY).not.toContain('unsafe-eval')
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/https?:/)
    expect(CONTENT_SECURITY_POLICY).not.toContain('*')
  })

  it('lets the dev server reach its own hot reload, and nothing wider', () => {
    expect(DEV_CONTENT_SECURITY_POLICY).toContain('ws://localhost:*')
    expect(DEV_CONTENT_SECURITY_POLICY).not.toMatch(/connect-src[^;]*\bws:(?!\/)/)
    expect(DEV_CONTENT_SECURITY_POLICY).not.toMatch(/https:/)
  })

  it('carries a placeholder into the markup, so nothing ships an unset policy', () => {
    const markup = readFileSync(join(import.meta.dirname, '../renderer/index.html'), 'utf8')
    expect(markup).toContain('http-equiv="Content-Security-Policy"')
    expect(markup).toContain('%CONTENT_SECURITY_POLICY%')
  })
})

describe('a document served over http, which carries headers', () => {
  it('is answered with the same policy, on top of whatever the response already had', () => {
    const answered = policyHeaderFor({ 'content-type': ['text/html'] })
    expect(answered['Content-Security-Policy']).toEqual([CONTENT_SECURITY_POLICY])
    expect(answered['content-type']).toEqual(['text/html'])
  })
})
