import type { OutputDevice } from './store.ts'
import { SYSTEM_DEFAULT } from './store.ts'

const AUDIO_OUTPUT = 'audiooutput'

export function outputsFrom(devices: readonly MediaDeviceInfo[]): OutputDevice[] {
  const outputs = devices
    .filter((device) => device.kind === AUDIO_OUTPUT)
    .map((device) => ({ id: device.deviceId, label: device.label || device.deviceId }))
  const rest = outputs.filter((device) => device.id !== SYSTEM_DEFAULT.id)
  const hasDefault = outputs.some((device) => device.id === SYSTEM_DEFAULT.id)
  return hasDefault ? [SYSTEM_DEFAULT, ...rest] : rest
}

export function stillThere(devices: readonly OutputDevice[], deviceId: string): boolean {
  return devices.some((device) => device.id === deviceId)
}

export async function listOutputs(media: MediaDevices): Promise<OutputDevice[]> {
  return outputsFrom(await media.enumerateDevices())
}
