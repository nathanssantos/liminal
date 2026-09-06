import type { OutputDevices } from '@liminal/protocol'
import {
  engineError,
  outputDevice,
  outputMute,
  outputVolume,
  transportPlay,
  transportPosition,
  transportStop,
} from '@liminal/protocol'
import type { OutputPreferences } from './preferences.ts'
import { readPreferences, writePreferences } from './preferences.ts'

export type SessionEvent =
  | { kind: 'transport'; state: 'playing' | 'stopped' }
  | { kind: 'position'; bar: number; beat: number; tick: number }
  | { kind: 'engineError'; code: string; message: string }

export type SessionOptions = {
  directory: string
  record: (event: SessionEvent) => void
  devices?: () => OutputDevices['devices']
}

export type Session = {
  handle: (name: string, payload: unknown) => Promise<unknown>
  preferences: () => OutputPreferences
}

export class UnknownChannelError extends Error {
  constructor(name: string) {
    super(`no handler for ${name}`)
    this.name = 'UnknownChannelError'
  }
}

export function createSession(options: SessionOptions): Session {
  let preferences = readPreferences(options.directory)
  const keep = (next: OutputPreferences) => {
    preferences = writePreferences(options.directory, next)
  }

  const handlers: Record<string, (payload: unknown) => unknown> = {
    [transportPlay.name]: () => {
      options.record({ kind: 'transport', state: 'playing' })
      return {}
    },
    [transportStop.name]: () => {
      options.record({ kind: 'transport', state: 'stopped' })
      return {}
    },
    [transportPosition.name]: (payload) => {
      const at = transportPosition.input.parse(payload)
      options.record({ kind: 'position', ...at })
      return {}
    },
    [engineError.name]: (payload) => {
      const failure = engineError.input.parse(payload)
      options.record({ kind: 'engineError', ...failure })
      return {}
    },
    [outputVolume.name]: (payload) => {
      keep({ ...preferences, gainDb: outputVolume.input.parse(payload).gainDb })
      return {}
    },
    [outputMute.name]: (payload) => {
      keep({ ...preferences, muted: outputMute.input.parse(payload).muted })
      return {}
    },
    [outputDevice.name]: (payload) => {
      const devices = options.devices?.() ?? []
      const wanted = outputDevice.input.parse(payload).id
      const known = devices.some((device) => device.id === wanted)
      keep({ ...preferences, deviceId: known ? wanted : preferences.deviceId })
      return { devices, selected: preferences.deviceId }
    },
  }

  return {
    handle: async (name, payload) => {
      const handler = handlers[name]
      if (handler === undefined) {
        throw new UnknownChannelError(name)
      }
      return handler(payload)
    },
    preferences: () => preferences,
  }
}
