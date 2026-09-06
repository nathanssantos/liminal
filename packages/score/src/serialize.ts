import type { $ZodIssue } from 'zod/v4/core'
import type { Score } from './schema.ts'
import { scoreSchema } from './schema.ts'
import type { Finding } from './validate.ts'
import { validate } from './validate.ts'

export type ScoreParseFailure =
  | { kind: 'json' }
  | { kind: 'shape'; issues: readonly $ZodIssue[] }
  | { kind: 'invariants'; findings: readonly Finding[] }

export class ScoreParseError extends Error {
  readonly failure: ScoreParseFailure

  constructor(message: string, failure: ScoreParseFailure, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ScoreParseError'
    this.failure = failure
  }
}

const pathOf = (path: readonly PropertyKey[]) => (path.length === 0 ? '(root)' : path.join('.'))

function withSortedKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(withSortedKeys)
  }
  if (value !== null && typeof value === 'object') {
    const source = value as Record<string, unknown>
    const sorted = Object.create(null) as Record<string, unknown>
    for (const key of Object.keys(source).sort()) {
      sorted[key] = withSortedKeys(source[key])
    }
    return sorted
  }
  return value
}

export function stringify(score: Score): string {
  return `${JSON.stringify(withSortedKeys(score), null, 2)}\n`
}

export function parse(json: string): Score {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch (cause) {
    throw new ScoreParseError(
      `the document is not readable JSON: ${cause instanceof Error ? cause.message : 'unknown'}`,
      { kind: 'json' },
      { cause },
    )
  }
  const shape = scoreSchema.safeParse(raw)
  if (!shape.success) {
    const issues = shape.error.issues
    throw new ScoreParseError(
      `the document does not have the shape of a score: ${issues
        .map((issue) => `${pathOf(issue.path)}: ${issue.message}`)
        .join('; ')}`,
      { kind: 'shape', issues },
      { cause: shape.error },
    )
  }
  const { errors } = validate(shape.data)
  if (errors.length > 0) {
    throw new ScoreParseError(
      `the document breaks the score invariants: ${errors
        .map((error) => `${pathOf(error.path)}: ${error.code} ${error.message}`)
        .join('; ')}`,
      { kind: 'invariants', findings: errors },
    )
  }
  return shape.data
}
