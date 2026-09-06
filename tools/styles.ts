import { globSync, readFileSync } from 'node:fs'

const LOOSE = [
  { name: 'a colour', pattern: /#[0-9a-fA-F]{3,8}\b/ },
  { name: 'a length', pattern: /\b\d+(\.\d+)?(px|rem|em)\b/ },
  { name: 'a duration', pattern: /\b\d+(\.\d+)?m?s\b/ },
  { name: 'a font', pattern: /font-family\s*:(?!\s*var\()/ },
]

const SCANNED = ['packages/ui/src/**/*.{css,tsx,ts}', 'apps/desktop/src/**/*.{css,tsx,ts}']

const HOLDS_THE_TOKENS = 'packages/ui/src/tokens.css'

const A_BREAKPOINT_CANNOT_BE_A_VARIABLE = /^\s*@media\b/

export function looseValues(): string[] {
  const found: string[] = []
  for (const path of globSync(SCANNED).sort()) {
    if (path.replaceAll('\\', '/') === HOLDS_THE_TOKENS) continue
    const lines = readFileSync(path, 'utf8').split('\n')
    lines.forEach((line, index) => {
      if (A_BREAKPOINT_CANNOT_BE_A_VARIABLE.test(line)) return
      for (const { name, pattern } of LOOSE) {
        if (pattern.test(line)) found.push(`${path}:${index + 1}: ${name} outside tokens.css`)
      }
    })
  }
  return found
}
