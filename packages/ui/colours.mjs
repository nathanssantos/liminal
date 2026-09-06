import { readFileSync } from 'node:fs'

const tokens = readFileSync(new URL('./src/tokens.css', import.meta.url), 'utf8')

export function colourToken(role) {
  const declaration = new RegExp(`--color-${role}:\\s*([^;]+);`).exec(tokens)
  const value = declaration?.[1]?.trim()
  if (!value) throw new Error(`tokens.css declares no colour role named ${role}`)
  return value
}

export const WINDOW_BACKGROUND = colourToken('surface')
