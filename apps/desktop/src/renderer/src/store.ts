import { OUTPUT_GAIN_DB, SAFE_OUTPUT_GAIN_DB } from '@liminal/protocol'
import { type Position, PPQ, type Score, ticksPerBar, ticksPerBeat } from '@liminal/score'
import { create } from 'zustand'

export type Transport = 'stopped' | 'starting' | 'playing' | 'ended'

export type Notice = {
  code: string
  title: string
  detail?: string
  tone: 'error' | 'warn'
  action?: 'choose-device'
}

export type OutputDevice = { id: string; label: string }

export const SYSTEM_DEFAULT: OutputDevice = { id: 'default', label: 'System default' }

export const STILL_LOADING_MS = 5000

export type ShellState = {
  score: Score | undefined
  transport: Transport
  position: Position
  gainDb: number
  muted: boolean
  devices: OutputDevice[]
  deviceId: string
  devicesPending: boolean
  notice: Notice | undefined
  loadTimedOut: boolean
  setScore: (score: Score) => void
  setTransport: (transport: Transport) => void
  setPosition: (position: Position) => void
  setGainDb: (gainDb: number) => void
  setMuted: (muted: boolean) => void
  setDevices: (devices: OutputDevice[]) => void
  setDeviceId: (deviceId: string) => void
  setDevicesPending: (devicesPending: boolean) => void
  raise: (notice: Notice) => void
  dismiss: () => void
  giveUpLoading: () => void
  requestPlay: () => void
  requestStop: () => void
  commitGainDb: (gainDb: number) => void
  toggleMuted: (muted: boolean) => void
  chooseDevice: (deviceId: string) => void
}

export type ShellSink = {
  play: () => void
  stop: () => void
  commitGainDb: (gainDb: number) => void
  setMuted: (muted: boolean) => void
  chooseDevice: (deviceId: string) => void
}

const NOT_ATTACHED: ShellSink = {
  play: () => {},
  stop: () => {},
  commitGainDb: () => {},
  setMuted: () => {},
  chooseDevice: () => {},
}

let sink: ShellSink = NOT_ATTACHED

export function attach(next: ShellSink): () => void {
  sink = next
  return () => {
    sink = NOT_ATTACHED
  }
}

export const AT_REST: Position = { bar: 0, beat: 0, tick: 0 }

export const useShell = create<ShellState>((set) => ({
  score: undefined,
  transport: 'stopped',
  position: AT_REST,
  gainDb: SAFE_OUTPUT_GAIN_DB,
  muted: false,
  devices: [SYSTEM_DEFAULT],
  deviceId: SYSTEM_DEFAULT.id,
  devicesPending: false,
  notice: undefined,
  loadTimedOut: false,
  setScore: (score) => set({ score, loadTimedOut: false }),
  setTransport: (transport) => set({ transport }),
  setPosition: (position) => set({ position }),
  setGainDb: (gainDb) => set({ gainDb }),
  setMuted: (muted) => set({ muted }),
  setDevices: (devices) => set({ devices }),
  setDeviceId: (deviceId) => set({ deviceId }),
  setDevicesPending: (devicesPending) => set({ devicesPending }),
  raise: (notice) => set({ notice }),
  dismiss: () => set({ notice: undefined }),
  giveUpLoading: () => set({ loadTimedOut: true }),
  requestPlay: () => {
    set({ transport: 'starting' })
    sink.play()
  },
  requestStop: () => sink.stop(),
  commitGainDb: (gainDb) => sink.commitGainDb(gainDb),
  toggleMuted: (muted) => {
    set({ muted })
    sink.setMuted(muted)
  },
  chooseDevice: (deviceId) => sink.chooseDevice(deviceId),
}))

export function readout(position: Position): string {
  return `${String(position.bar + 1).padStart(2, '0')}:${position.beat + 1}`
}

export function decibels(gainDb: number): string {
  return gainDb <= -60 ? '−∞ dB' : `−${Math.abs(gainDb)} dB`.replace('−0', '0')
}

export function gainForDigit(digit: number): number {
  return -60 + digit * 6
}

export const OUTPUT_GAIN_MIN_DB = OUTPUT_GAIN_DB.min
export const OUTPUT_GAIN_MAX_DB = OUTPUT_GAIN_DB.max

export const MUTE_STATE_LABEL = { on: 'muted', off: 'not muted' }

const EXAMPLE_SET = 'Example set'
const WAITING_TITLE = 'Loading the set…'

const HINTS: Record<Transport, string> = {
  stopped: 'Ready. Press play.',
  starting: 'Ready. Press play.',
  playing: 'Playing. This example is sixteen bars long.',
  ended: 'The set reached the end. Press play to hear it again.',
}

const STILL_LOADING = 'The set is still loading.'
const NOTHING_LOADED = 'Nothing is loaded yet.'
const NO_DEVICE_HINT = 'No output device. Connect speakers or headphones.'

export const NO_PAUSE_REASON = 'This set can only be stopped, not paused.'

const STILL_LOADING_REASON = 'The set is still loading.'
const LOAD_GAVE_UP_REASON = 'The set did not load.'
const NO_DEVICE_REASON = 'Connect speakers or headphones first.'

const MODES: Record<string, string> = {
  major: 'maj',
  minor: 'min',
  dorian: 'dor',
  phrygian: 'phr',
  lydian: 'lyd',
  mixolydian: 'mix',
}

type Numbers = {
  tempo: number | null
  musicalKey: string | null
  bar: number | null
  beat: number | null
  elapsedMs: number | null
}

export function shortKey(key: { tonic: string; mode: string } | undefined): string | null {
  if (!key) return null
  return `${key.tonic} ${MODES[key.mode] ?? key.mode}`
}

export function playGuard(
  shell: Pick<ShellState, 'score' | 'loadTimedOut' | 'devices'>,
): string | undefined {
  if (shell.devices.length === 0) return NO_DEVICE_REASON
  if (shell.loadTimedOut) return LOAD_GAVE_UP_REASON
  if (!shell.score) return STILL_LOADING_REASON
  return undefined
}

export function titleFor(shell: Pick<ShellState, 'score'>): string {
  if (!shell.score) return WAITING_TITLE
  return shell.score.lineage?.label ?? EXAMPLE_SET
}

export function hintFor(
  shell: Pick<ShellState, 'score' | 'loadTimedOut' | 'devices' | 'transport'>,
): string {
  if (shell.devices.length === 0) return NO_DEVICE_HINT
  if (shell.loadTimedOut) return NOTHING_LOADED
  if (!shell.score) return STILL_LOADING
  return HINTS[shell.transport]
}

export function readoutOf(shell: Pick<ShellState, 'score' | 'position'>): Numbers {
  if (!shell.score) {
    return { tempo: null, musicalKey: null, bar: null, beat: null, elapsedMs: null }
  }
  const bpm = shell.score.tempo.bpm
  return {
    tempo: bpm,
    musicalKey: shortKey(shell.score.key),
    bar: shell.position.bar + 1,
    beat: shell.position.beat + 1,
    elapsedMs: elapsedMsAt(absoluteTick(shell.position, shell.score.meter), bpm),
  }
}

export function absoluteTick(position: Position, meter: Score['meter']): number {
  return position.bar * ticksPerBar(meter) + position.beat * ticksPerBeat(meter) + position.tick
}

export function elapsedMsAt(tick: number, bpm: number): number {
  return (tick / PPQ) * (MS_PER_MINUTE / bpm)
}

const MS_PER_MINUTE = 60 * 1000
