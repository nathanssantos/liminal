export { PARAM_REQUIRES_FX, PITCHED_ROLE_RANGES, RANGES } from './constants.ts'
export type { Rng } from './rng.ts'
export { createRng, newId } from './rng.ts'
export type {
  Automation,
  AutomationParam,
  AutomationPoint,
  AutomationTarget,
  Bar,
  Clip,
  Curve,
  FxKind,
  FxRef,
  InstrumentRef,
  Lineage,
  Meter,
  Mix,
  Mode,
  Note,
  Score,
  Section,
  SectionRole,
  SynthPreset,
  Tick,
  Tonic,
  Track,
  TrackRole,
} from './schema.ts'
export { PPQ, SCORE_VERSION, scoreSchema } from './schema.ts'
export type { ScoreParseFailure } from './serialize.ts'
export { parse, ScoreParseError, stringify } from './serialize.ts'
export type { Position, TimeSignature } from './time.ts'
export {
  barToTick,
  scoreLengthBars,
  scoreLengthTicks,
  sectionAt,
  ticksPerBar,
  ticksPerBeat,
  tickToPosition,
} from './time.ts'
export type { Finding, FindingCode, ValidationResult } from './validate.ts'
export { validate } from './validate.ts'
