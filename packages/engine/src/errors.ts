export type EngineErrorCode =
  | 'unknown-preset'
  | 'unknown-instrument-param'
  | 'unsupported-fx'
  | 'unknown-fx-param'
  | 'automation-target-missing'
  | 'automation-out-of-range'
  | 'invalid-score'

export class EngineError extends Error {
  readonly code: EngineErrorCode

  readonly detail: Record<string, string | number>

  constructor(
    code: EngineErrorCode,
    message: string,
    detail: Record<string, string | number> = {},
  ) {
    super(message)
    this.name = 'EngineError'
    this.code = code
    this.detail = detail
  }
}
