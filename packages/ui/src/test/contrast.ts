function channel(value: number): number {
  const normalized = value / 255
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match?.[1]) throw new Error(`${hex} is not a six-digit hex colour`)
  const digits = match[1]
  const red = channel(Number.parseInt(digits.slice(0, 2), 16))
  const green = channel(Number.parseInt(digits.slice(2, 4), 16))
  const blue = channel(Number.parseInt(digits.slice(4, 6), 16))
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(foreground)
  const second = relativeLuminance(background)
  const lighter = Math.max(first, second)
  const darker = Math.min(first, second)
  return (lighter + 0.05) / (darker + 0.05)
}

export function customProperties(css: string, selector: string): Record<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const block = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css)
  if (!block?.[1]) throw new Error(`tokens.css has no block for ${selector}`)
  const properties: Record<string, string> = {}
  for (const line of block[1].split(';')) {
    const declaration = /^\s*(--[\w-]+)\s*:\s*(.+?)\s*$/.exec(line)
    if (declaration?.[1] && declaration[2]) properties[declaration[1]] = declaration[2]
  }
  return properties
}
