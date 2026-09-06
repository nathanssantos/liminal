import type { Score } from './schema.ts'
import { scoreSchema } from './schema.ts'
import { validate } from './validate.ts'

export class ScoreParseError extends Error {
  readonly problems: string[]

  constructor(problems: string[]) {
    super(`the document is not a valid score: ${problems.join('; ')}`)
    this.name = 'ScoreParseError'
    this.problems = problems
  }
}

function withSortedKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(withSortedKeys)
  }
  if (value !== null && typeof value === 'object') {
    const source = value as Record<string, unknown>
    const sorted: Record<string, unknown> = {}
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
    throw new ScoreParseError([cause instanceof Error ? cause.message : 'unreadable JSON'])
  }
  const shape = scoreSchema.safeParse(raw)
  if (!shape.success) {
    throw new ScoreParseError(
      shape.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
    )
  }
  const { errors } = validate(shape.data)
  if (errors.length > 0) {
    throw new ScoreParseError(
      errors.map((error) => `${error.path.join('.') || '(root)'}: ${error.code} ${error.message}`),
    )
  }
  return shape.data
}
