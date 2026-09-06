import { SAFE_OUTPUT_GAIN_DB } from '@liminal/protocol'
import type { Position, Score } from '@liminal/score'
import { create } from 'zustand'

export type Transport = 'stopped' | 'playing' | 'ended'

export type Notice = { code: string; title: string; action?: 'choose-device' }

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
  notice: Notice | undefined
  loadTimedOut: boolean
  setScore: (score: Score) => void
  setTransport: (transport: Transport) => void
  setPosition: (position: Position) => void
  setGainDb: (gainDb: number) => void
  setMuted: (muted: boolean) => void
  setDevices: (devices: OutputDevice[]) => void
  setDeviceId: (deviceId: string) => void
  raise: (notice: Notice) => void
  dismiss: () => void
  giveUpLoading: () => void
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
  notice: undefined,
  loadTimedOut: false,
  setScore: (score) => set({ score, loadTimedOut: false }),
  setTransport: (transport) => set({ transport }),
  setPosition: (position) => set({ position }),
  setGainDb: (gainDb) => set({ gainDb }),
  setMuted: (muted) => set({ muted }),
  setDevices: (devices) => set({ devices }),
  setDeviceId: (deviceId) => set({ deviceId }),
  raise: (notice) => set({ notice }),
  dismiss: () => set({ notice: undefined }),
  giveUpLoading: () => set({ loadTimedOut: true }),
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
