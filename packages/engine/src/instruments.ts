import type { InstrumentRef, Score, SynthPreset } from '@liminal/score'
import { EngineError } from './errors.ts'
import type { NodeLedger } from './graph.ts'
import type { Tone, ToneContext, ToneNode } from './tone.ts'

export type Voice = {
  node: ToneNode
  trigger: (pitch: number, durationSeconds: number, time: number, velocity: number) => void
}

const ENVELOPES = {
  kick: { attack: 0.001, decay: 0.32, sustain: 0, release: 0.02 },
  hat: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.01 },
  clap: { attack: 0.002, decay: 0.14, sustain: 0, release: 0.02 },
  'bass-mono': { attack: 0.005, decay: 0.12, sustain: 0.7, release: 0.1 },
  'sub-sine': { attack: 0.02, decay: 0.1, sustain: 0.9, release: 0.3 },
  'poly-saw': { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.4 },
  'pad-fm': { attack: 0.4, decay: 0.3, sustain: 0.8, release: 1.2 },
  'lead-am': { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.3 },
  noise: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.02 },
} satisfies Record<SynthPreset, { attack: number; decay: number; sustain: number; release: number }>

const PRESET_TAIL_SECONDS = Object.fromEntries(
  Object.entries(ENVELOPES).map(([preset, envelope]) => [
    preset,
    envelope.sustain > 0 ? envelope.release : envelope.decay + envelope.release,
  ]),
) as Record<SynthPreset, number>

export function scoreReleaseTailSeconds(score: Score): number {
  return Math.max(
    0,
    ...score.tracks.map((track) =>
      track.instrument.kind === 'synth' ? PRESET_TAIL_SECONDS[track.instrument.preset] : 0,
    ),
  )
}

type Build = (tone: Tone, context: ToneContext, ledger: NodeLedger) => Voice

type Pitched = ToneNode & {
  triggerAttackRelease: (note: number, duration: number, time: number, velocity: number) => unknown
}

type Unpitched = ToneNode & {
  triggerAttackRelease: (duration: number, time: number, velocity: number) => unknown
}

const MAX_CHORD_VOICES = 8

const playsPitched = (tone: Tone, node: Pitched): Voice => ({
  node,
  trigger: (pitch, duration, time, velocity) => {
    node.triggerAttackRelease(tone.Frequency(pitch, 'midi').toFrequency(), duration, time, velocity)
  },
})

const playsUnpitched = (node: Unpitched): Voice => ({
  node,
  trigger: (_pitch, duration, time, velocity) => {
    node.triggerAttackRelease(duration, time, velocity)
  },
})

const BUILDERS = {
  kick: (tone, context, ledger) =>
    playsPitched(
      tone,
      ledger.add(
        new tone.MembraneSynth({
          context,
          pitchDecay: 0.03,
          octaves: 6,
          envelope: ENVELOPES.kick,
        }),
      ),
    ),
  hat: (tone, context, ledger) =>
    playsPitched(
      tone,
      ledger.add(
        new tone.MetalSynth({
          context,
          envelope: ENVELOPES.hat,
          harmonicity: 5.1,
          resonance: 4000,
          octaves: 1.5,
        }),
      ),
    ),
  clap: (tone, context, ledger) =>
    playsUnpitched(
      ledger.add(
        new tone.NoiseSynth({ context, noise: { type: 'white' }, envelope: ENVELOPES.clap }),
      ),
    ),
  'bass-mono': (tone, context, ledger) =>
    playsPitched(
      tone,
      ledger.add(
        new tone.MonoSynth({
          context,
          oscillator: { type: 'sawtooth' },
          filter: { Q: 2, type: 'lowpass' },
          envelope: ENVELOPES['bass-mono'],
          filterEnvelope: {
            attack: 0.005,
            decay: 0.15,
            sustain: 0.4,
            baseFrequency: 120,
            octaves: 3,
          },
        }),
      ),
    ),
  'sub-sine': (tone, context, ledger) =>
    playsPitched(
      tone,
      ledger.add(
        new tone.Synth({
          context,
          oscillator: { type: 'sine' },
          envelope: ENVELOPES['sub-sine'],
        }),
      ),
    ),
  'poly-saw': (tone, context, ledger) =>
    playsPitched(
      tone,
      ledger.add(
        new tone.PolySynth({
          context,
          maxPolyphony: MAX_CHORD_VOICES,
          voice: tone.Synth,
          options: { oscillator: { type: 'sawtooth' }, envelope: ENVELOPES['poly-saw'] },
        }),
      ),
    ),
  'pad-fm': (tone, context, ledger) =>
    playsPitched(
      tone,
      ledger.add(
        new tone.FMSynth({
          context,
          harmonicity: 2,
          modulationIndex: 6,
          envelope: ENVELOPES['pad-fm'],
        }),
      ),
    ),
  'lead-am': (tone, context, ledger) =>
    playsPitched(
      tone,
      ledger.add(new tone.AMSynth({ context, harmonicity: 3, envelope: ENVELOPES['lead-am'] })),
    ),
  noise: (tone, context, ledger) =>
    playsUnpitched(
      ledger.add(
        new tone.NoiseSynth({ context, noise: { type: 'pink' }, envelope: ENVELOPES.noise }),
      ),
    ),
} satisfies Record<SynthPreset, Build>

type Range = { min: number; max: number }

const PARAMS: Record<SynthPreset, Record<string, Range>> = {
  kick: { pitchDecay: { min: 0, max: 1 }, octaves: { min: 0, max: 12 } },
  hat: {
    harmonicity: { min: 0, max: 64 },
    resonance: { min: 20, max: 20000 },
    octaves: { min: 0, max: 12 },
  },
  clap: {},
  'bass-mono': { portamento: { min: 0, max: 1 } },
  'sub-sine': { portamento: { min: 0, max: 1 } },
  'poly-saw': { maxPolyphony: { min: 1, max: 64 } },
  'pad-fm': { harmonicity: { min: 0, max: 64 }, modulationIndex: { min: 0, max: 100 } },
  'lead-am': { harmonicity: { min: 0, max: 64 } },
  noise: {},
}

const hasNumericValue = (target: unknown): target is { value: number } =>
  typeof target === 'object' &&
  target !== null &&
  'value' in target &&
  typeof (target as { value: unknown }).value === 'number'

function applyNumber(node: ToneNode, name: string, value: number, preset: SynthPreset): void {
  const current = Reflect.get(node, name)
  if (hasNumericValue(current)) {
    current.value = value
    return
  }
  if (typeof current === 'number' && Reflect.set(node, name, value)) {
    return
  }
  throw new EngineError(
    'unknown-instrument-param',
    `preset ${preset} cannot take a number for ${name}`,
    { preset, param: name },
  )
}

export function createVoice(
  tone: Tone,
  context: ToneContext,
  ledger: NodeLedger,
  instrument: InstrumentRef,
): Voice {
  if (instrument.kind === 'sampler') {
    throw new EngineError('unknown-preset', 'the sampler instrument arrives after M5', {
      bank: instrument.bank,
    })
  }
  if (!Object.hasOwn(BUILDERS, instrument.preset)) {
    throw new EngineError('unknown-preset', `no voice is registered for ${instrument.preset}`, {
      preset: instrument.preset,
    })
  }
  const voice = BUILDERS[instrument.preset](tone, context, ledger)
  const allowed = PARAMS[instrument.preset]
  for (const [name, value] of Object.entries(instrument.params ?? {})) {
    const range = Object.hasOwn(allowed, name) ? allowed[name] : undefined
    if (range === undefined) {
      throw new EngineError(
        'unknown-instrument-param',
        `preset ${instrument.preset} exposes no parameter ${name}`,
        { preset: instrument.preset, param: name },
      )
    }
    if (value < range.min || value > range.max) {
      throw new EngineError(
        'unknown-instrument-param',
        `preset ${instrument.preset} takes ${name} between ${range.min} and ${range.max}, not ${value}`,
        { preset: instrument.preset, param: name, value },
      )
    }
    applyNumber(voice.node, name, value, instrument.preset)
  }
  return voice
}

export const SUPPORTED_PRESETS = Object.keys(BUILDERS) as readonly SynthPreset[]
