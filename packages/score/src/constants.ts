import type { AutomationParam, FxKind, TrackRole } from './schema.ts'

export const RANGES = {
  bpm: { min: 40, max: 220 },
  beatsPerBar: { min: 2, max: 12 },
  seed: { min: 0, max: 0xffffffff },
  pitch: { min: 0, max: 127 },
  velocity: { min: 0, max: 1 },
  gainDb: { min: -60, max: 6 },
  pan: { min: -1, max: 1 },
  energy: { min: 0, max: 1 },
} as const

export const PITCHED_ROLE_RANGES: Partial<Record<TrackRole, { min: number; max: number }>> = {
  sub: { min: 24, max: 48 },
  bass: { min: 28, max: 60 },
  chords: { min: 48, max: 84 },
  pad: { min: 48, max: 84 },
  lead: { min: 60, max: 96 },
  arp: { min: 55, max: 96 },
}

export const PARAM_REQUIRES_FX: Partial<Record<AutomationParam, FxKind>> = {
  'filter.cutoff': 'filter',
  'filter.q': 'filter',
  'send.reverb': 'reverb',
  'send.delay': 'delay',
}
