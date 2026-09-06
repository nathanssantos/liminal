import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const LOOSE = [
  { name: 'a colour', pattern: /#[0-9a-fA-F]{3,8}\b/, exemptInMediaQuery: false },
  { name: 'a length', pattern: /\b\d+(\.\d+)?(px|rem|em)\b/, exemptInMediaQuery: true },
  { name: 'a duration', pattern: /\b\d+(\.\d+)?m?s\b/, exemptInMediaQuery: false },
  { name: 'a font', pattern: /font-family\s*:(?!\s*var\()/, exemptInMediaQuery: false },
]

const SCANNED = ['packages/ui/src/**/*.{css,tsx,ts}', 'apps/desktop/src/**/*.{css,tsx,ts}']

const HOLDS_THE_TOKENS = 'packages/ui/src/tokens.css'

const REPOSITORY_ROOT = fileURLToPath(new URL('..', import.meta.url))

const A_BREAKPOINT_CANNOT_BE_A_VARIABLE = /^\s*@media\b/

export function scannedFiles(): string[] {
  return globSync(SCANNED, { cwd: REPOSITORY_ROOT })
    .map((path) => path.replaceAll('\\', '/'))
    .filter((path) => path !== HOLDS_THE_TOKENS)
    .sort()
}

export function looseValuesInLine(line: string): string[] {
  const inMediaQuery = A_BREAKPOINT_CANNOT_BE_A_VARIABLE.test(line)
  return LOOSE.filter(
    ({ pattern, exemptInMediaQuery }) =>
      !(inMediaQuery && exemptInMediaQuery) && pattern.test(line),
  ).map(({ name }) => name)
}

export function looseValues(): string[] {
  const found: string[] = []
  for (const path of scannedFiles()) {
    const lines = readFileSync(join(REPOSITORY_ROOT, path), 'utf8').split('\n')
    lines.forEach((line, index) => {
      for (const name of looseValuesInLine(line)) {
        found.push(`${path}:${index + 1}: ${name} outside tokens.css`)
      }
    })
  }
  return found
}
