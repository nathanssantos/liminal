import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const NAMED_COLOURS =
  /\b(?:aqua|beige|black|blue|brown|coral|crimson|cyan|fuchsia|gold|gray|grey|green|indigo|ivory|khaki|lime|magenta|maroon|navy|olive|orange|orchid|pink|plum|purple|red|salmon|silver|snow|tan|teal|tomato|violet|wheat|white|yellow)\b/

const LOOSE = [
  { name: 'a colour', pattern: /#[0-9a-fA-F]{3,8}\b/, exemptInMediaQuery: false },
  {
    name: 'a colour function',
    pattern: /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix)\(/,
    exemptInMediaQuery: false,
  },
  {
    name: 'a colour by name',
    pattern: new RegExp(
      `(?:color|background|border|fill|stroke|outline)[\\w-]*\\s*:[^;]*${NAMED_COLOURS.source}`,
    ),
    exemptInMediaQuery: false,
  },
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

export function looseValuesInText(text: string, path: string): string[] {
  return text
    .split('\n')
    .flatMap((line, index) =>
      looseValuesInLine(line).map((name) => `${path}:${index + 1}: ${name} outside tokens.css`),
    )
}

export function looseValues(): string[] {
  return scannedFiles().flatMap((path) =>
    looseValuesInText(readFileSync(join(REPOSITORY_ROOT, path), 'utf8'), path),
  )
}
