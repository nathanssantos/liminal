import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SOURCE = fileURLToPath(new URL('.', import.meta.url))

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name)
    if (entry.isDirectory()) {
      return sourceFiles(full)
    }
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [full] : []
  })
}

describe('@liminal/score stays usable in the renderer', () => {
  it('imports no node builtin outside its tests', () => {
    const offenders = sourceFiles(SOURCE).filter((file) =>
      /['"`]node:[a-z/]+['"`]/.test(readFileSync(file, 'utf8')),
    )
    expect(offenders).toEqual([])
  })

  it('declares zod as its only runtime dependency', () => {
    const manifest = JSON.parse(
      readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'),
    ) as { dependencies?: Record<string, string> }
    expect(Object.keys(manifest.dependencies ?? {})).toEqual(['zod'])
  })
})
