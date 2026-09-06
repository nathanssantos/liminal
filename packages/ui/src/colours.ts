import tokens from './tokens.css?raw'

export function colourToken(role: string): string {
  const declaration = new RegExp(`--color-${role}:\\s*([^;]+);`).exec(tokens)
  const value = declaration?.[1]?.trim()
  if (!value) throw new Error(`tokens.css declares no colour role named ${role}`)
  return value
}

export const WINDOW_BACKGROUND = colourToken('surface')
