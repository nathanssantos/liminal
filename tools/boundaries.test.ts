import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { boundaryViolations, type Manifest } from './boundaries.ts'

function readWorkspaceManifests(): Manifest[] {
  const files = globSync(['packages/*/package.json', 'apps/*/package.json'])
  return files.map((path) => {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as Omit<Manifest, 'path'>
    return { ...parsed, path }
  })
}

describe('package boundaries', () => {
  it('every workspace package declares only the dependencies the architecture allows', () => {
    const manifests = readWorkspaceManifests()
    expect(manifests.length).toBeGreaterThan(0)
    expect(boundaryViolations(manifests)).toEqual([])
  })

  it('catches a package importing outside the table', () => {
    const violations = boundaryViolations([
      {
        path: join('packages', 'score', 'package.json'),
        name: '@liminal/score',
        dependencies: { '@liminal/engine': 'workspace:*' },
      },
    ])
    expect(violations).toEqual([
      'packages/score/package.json: @liminal/score may not import @liminal/engine',
    ])
  })

  it('catches the ui package importing the engine', () => {
    const violations = boundaryViolations([
      {
        path: join('packages', 'ui', 'package.json'),
        name: '@liminal/ui',
        dependencies: { '@liminal/engine': 'workspace:*' },
      },
    ])
    expect(violations).toEqual([
      'packages/ui/package.json: @liminal/ui may not import @liminal/engine',
    ])
  })

  it('catches a package that is not in the architecture table', () => {
    const violations = boundaryViolations([
      { path: 'packages/ghost/package.json', name: '@liminal/ghost' },
    ])
    expect(violations).toEqual([
      'packages/ghost/package.json: @liminal/ghost is not in the architecture table',
    ])
  })
})
