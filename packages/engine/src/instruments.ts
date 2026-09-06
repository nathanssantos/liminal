import type { InstrumentRef, SynthPreset } from '@liminal/score'
import { EngineError } from './errors.ts'
import type { NodeLedger } from './graph.ts'
import type { Tone, ToneContext, ToneNode } from './tone.ts'

export type Voice = {
  node: ToneNode
  trigger: (pitch: number, durationSeconds: number, time: number, velocity: number) => void
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
          envelope: { attack: 0.001, decay: 0.32, sustain: 0, release: 0.02 },
        }),
      ),
    ),
  hat: (tone, context, ledger) =>
    playsPitched(
      tone,
      ledger.add(
        new tone.MetalSynth({
          context,
          envelope: { attack: 0.001, decay: 0.06, release: 0.01 },
          harmonicity: 5.1,
          resonance: 4000,
          octaves: 1.5,
        }),
      ),
    ),
  clap: (tone, context, ledger) =>
    playsUnpitched(
      ledger.add(
        new tone.NoiseSynth({
          context,
          noise: { type: 'white' },
          envelope: { attack: 0.002, decay: 0.14, sustain: 0 },
        }),
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
          envelope: { attack: 0.005, decay: 0.12, sustain: 0.7, release: 0.1 },
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
          envelope: { attack: 0.02, decay: 0.1, sustain: 0.9, release: 0.3 },
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
          options: {
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.4 },
          },
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
          envelope: { attack: 0.4, decay: 0.3, sustain: 0.8, release: 1.2 },
        }),
      ),
    ),
  'lead-am': (tone, context, ledger) =>
    playsPitched(
      tone,
      ledger.add(
        new tone.AMSynth({
          context,
          harmonicity: 3,
          envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.3 },
        }),
      ),
    ),
  noise: (tone, context, ledger) =>
    playsUnpitched(
      ledger.add(
        new tone.NoiseSynth({
          context,
          noise: { type: 'pink' },
          envelope: { attack: 0.01, decay: 0.3, sustain: 0 },
        }),
      ),
    ),
} satisfies Record<SynthPreset, Build>

const PARAMS: Record<SynthPreset, readonly string[]> = {
  kick: ['pitchDecay', 'octaves'],
  hat: ['harmonicity', 'resonance', 'octaves'],
  clap: [],
  'bass-mono': ['portamento'],
  'sub-sine': ['portamento'],
  'poly-saw': ['maxPolyphony'],
  'pad-fm': ['harmonicity', 'modulationIndex'],
  'lead-am': ['harmonicity'],
  noise: [],
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
  const build = BUILDERS[instrument.preset]
  if (build === undefined) {
    throw new EngineError('unknown-preset', `no voice is registered for ${instrument.preset}`, {
      preset: instrument.preset,
    })
  }
  const voice = build(tone, context, ledger)
  const allowed = PARAMS[instrument.preset]
  for (const [name, value] of Object.entries(instrument.params ?? {})) {
    if (!allowed.includes(name)) {
      throw new EngineError(
        'unknown-instrument-param',
        `preset ${instrument.preset} exposes no parameter ${name}`,
        { preset: instrument.preset, param: name },
      )
    }
    Reflect.set(voice.node, name, value)
  }
  return voice
}

export const SUPPORTED_PRESETS = Object.keys(BUILDERS) as readonly SynthPreset[]
