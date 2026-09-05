export type Manifest = {
  path: string
  name: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

const INTERNAL_PREFIX = '@liminal/'

const ALLOWED: Record<string, readonly string[]> = {
  '@liminal/score': [],
  '@liminal/composition': ['@liminal/score'],
  '@liminal/engine': ['@liminal/score'],
  '@liminal/analysis': ['@liminal/score'],
  '@liminal/brain': [
    '@liminal/score',
    '@liminal/composition',
    '@liminal/analysis',
    '@liminal/protocol',
  ],
  '@liminal/conductor': [
    '@liminal/score',
    '@liminal/composition',
    '@liminal/analysis',
    '@liminal/brain',
    '@liminal/protocol',
  ],
  '@liminal/protocol': ['@liminal/score', '@liminal/analysis'],
  desktop: [
    '@liminal/score',
    '@liminal/composition',
    '@liminal/engine',
    '@liminal/analysis',
    '@liminal/brain',
    '@liminal/conductor',
    '@liminal/protocol',
  ],
}

export function boundaryViolations(manifests: readonly Manifest[]): string[] {
  const violations: string[] = []
  for (const manifest of manifests) {
    const allowed = ALLOWED[manifest.name]
    if (allowed === undefined) {
      violations.push(`${manifest.path}: ${manifest.name} is not in the architecture table`)
      continue
    }
    const declared = [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.devDependencies ?? {}),
    ].filter((dependency) => dependency.startsWith(INTERNAL_PREFIX))
    for (const dependency of declared) {
      if (!allowed.includes(dependency)) {
        violations.push(`${manifest.path}: ${manifest.name} may not import ${dependency}`)
      }
    }
  }
  return violations
}
