import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SOURCE = fileURLToPath(new URL('.', import.meta.url))

const MANIFEST = fileURLToPath(new URL('../package.json', import.meta.url))

function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name)
    if (entry.isDirectory()) {
      return sources(full)
    }
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [full] : []
  })
}

const offenders = (pattern: RegExp) =>
  sources(SOURCE)
    .filter((file) => pattern.test(readFileSync(file, 'utf8')))
    .map((file) => file.slice(SOURCE.length))

describe('@liminal/engine runs wherever an AudioContext does', () => {
  it('imports no node builtin outside its tests', () => {
    expect(offenders(/['"`]node:[a-z/]+['"`]/)).toEqual([])
  })

  it('imports the Node audio polyfill nowhere in its sources', () => {
    expect(offenders(/node-web-audio-api/)).toEqual([])
  })

  it('touches no browser global', () => {
    expect(offenders(/\b(window|document|navigator|localStorage)\b/)).toEqual([])
  })

  it('creates no context of its own, because it is given one', () => {
    expect(offenders(/new\s+(AudioContext|OfflineAudioContext)\b/)).toEqual([])
  })

  it('names tone in one module only, so the Node polyfill can load first', () => {
    expect(offenders(/from\s+['"]tone['"]|import\(['"]tone['"]\)/)).toEqual(['tone.ts'])
  })

  it('builds every Tone node through the ledger, so dispose can be proven', () => {
    const escaped = sources(SOURCE).flatMap((file) => {
      const name = file.slice(SOURCE.length)
      if (name === 'tone.ts') {
        return []
      }
      const text = readFileSync(file, 'utf8')
      const built = [...text.matchAll(/new\s+tone\.[A-Z]\w*/g)].length
      const ledgered = [...text.matchAll(/ledger\.add\(\s*new\s+tone\.[A-Z]\w*/g)].length
      return built === ledgered ? [] : [`${name}: ${built - ledgered} outside the ledger`]
    })
    expect(escaped).toEqual([])
  })

  it('keeps the Node audio polyfill in devDependencies only', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    expect(Object.keys(manifest.dependencies ?? {})).toEqual(['@liminal/score', 'tone'])
    expect(Object.keys(manifest.devDependencies ?? {})).toContain('node-web-audio-api')
  })
})
