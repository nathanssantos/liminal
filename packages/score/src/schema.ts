import { z } from 'zod'

export const SCORE_VERSION = 1

export const PPQ = 960

const tick = z.number()
const bar = z.number()
const positive = z.number()

export const tonicSchema = z.enum(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])

export const modeSchema = z.enum(['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian'])

export const sectionRoleSchema = z.enum(['intro', 'build', 'drop', 'break', 'bridge', 'outro'])

export const trackRoleSchema = z.enum([
  'kick',
  'snare',
  'clap',
  'hat',
  'perc',
  'sub',
  'bass',
  'chords',
  'pad',
  'lead',
  'arp',
  'fx',
])

export const synthPresetSchema = z.enum([
  'kick',
  'hat',
  'clap',
  'bass-mono',
  'sub-sine',
  'poly-saw',
  'pad-fm',
  'lead-am',
  'noise',
])

export const fxKindSchema = z.enum(['filter', 'eq3', 'compressor', 'distortion', 'delay', 'reverb'])

export const automationParamSchema = z.enum([
  'gainDb',
  'pan',
  'filter.cutoff',
  'filter.q',
  'send.reverb',
  'send.delay',
])

export const curveSchema = z.enum(['step', 'linear', 'exp'])

export const instrumentRefSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('synth'),
    preset: synthPresetSchema,
    params: z.record(z.string(), z.number()).optional(),
  }),
  z.object({
    kind: z.literal('sampler'),
    bank: z.string().min(1),
    params: z.record(z.string(), z.number()).optional(),
  }),
])

export const fxRefSchema = z.object({
  kind: fxKindSchema,
  params: z.record(z.string(), z.number()),
})

export const sectionSchema = z.object({
  id: z.string().min(1),
  role: sectionRoleSchema,
  startBar: bar,
  bars: positive,
  energy: z.number(),
})

export const trackSchema = z.object({
  id: z.string().min(1),
  role: trackRoleSchema,
  instrument: instrumentRefSchema,
  gainDb: z.number(),
  pan: z.number(),
  muted: z.boolean(),
  fx: z.array(fxRefSchema),
})

export const noteSchema = z.object({
  at: tick,
  duration: positive,
  pitch: z.number(),
  velocity: z.number(),
})

export const clipSchema = z.object({
  id: z.string().min(1),
  trackId: z.string().min(1),
  start: tick,
  length: positive,
  notes: z.array(noteSchema),
})

export const automationTargetSchema = z.union([
  z.object({ trackId: z.string().min(1), param: automationParamSchema }),
  z.object({ master: z.literal('gainDb') }),
])

export const automationPointSchema = z.object({
  at: tick,
  value: z.number(),
  curve: curveSchema,
})

export const automationSchema = z.object({
  id: z.string().min(1),
  target: automationTargetSchema,
  points: z.array(automationPointSchema),
})

export const mixSchema = z.object({
  master: z.object({ gainDb: z.number(), limiter: z.boolean() }),
})

export const meterSchema = z.object({
  beatsPerBar: z.number(),
  beatUnit: z.literal(4),
})

export const lineageSchema = z.object({
  parentId: z.string().min(1).optional(),
  styleCardId: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
})

export const scoreSchema = z.object({
  version: z.literal(SCORE_VERSION),
  id: z.string().min(1),
  seed: z.number(),
  tempo: z.object({ bpm: z.number() }),
  meter: meterSchema,
  key: z.object({ tonic: tonicSchema, mode: modeSchema }),
  sections: z.array(sectionSchema),
  tracks: z.array(trackSchema),
  clips: z.array(clipSchema),
  automation: z.array(automationSchema),
  mix: mixSchema,
  lineage: lineageSchema.optional(),
})

export type Tick = number
export type Bar = number
export type Tonic = z.infer<typeof tonicSchema>
export type Mode = z.infer<typeof modeSchema>
export type SectionRole = z.infer<typeof sectionRoleSchema>
export type TrackRole = z.infer<typeof trackRoleSchema>
export type SynthPreset = z.infer<typeof synthPresetSchema>
export type FxKind = z.infer<typeof fxKindSchema>
export type AutomationParam = z.infer<typeof automationParamSchema>
export type Curve = z.infer<typeof curveSchema>
export type InstrumentRef = z.infer<typeof instrumentRefSchema>
export type FxRef = z.infer<typeof fxRefSchema>
export type Section = z.infer<typeof sectionSchema>
export type Track = z.infer<typeof trackSchema>
export type Note = z.infer<typeof noteSchema>
export type Clip = z.infer<typeof clipSchema>
export type AutomationTarget = z.infer<typeof automationTargetSchema>
export type AutomationPoint = z.infer<typeof automationPointSchema>
export type Automation = z.infer<typeof automationSchema>
export type Mix = z.infer<typeof mixSchema>
export type Meter = z.infer<typeof meterSchema>
export type Lineage = z.infer<typeof lineageSchema>
export type Score = z.infer<typeof scoreSchema>
