import { scoreSchema } from '@liminal/score'
import { z } from 'zod'
import { defineChannel } from './channel.ts'

export const OUTPUT_GAIN_DB = { min: -60, max: 0 }

export const SAFE_OUTPUT_GAIN_DB = -12

const nothing = z.strictObject({})

const positionSchema = z.strictObject({
  bar: z.number().int().min(0),
  beat: z.number().int().min(0),
  tick: z.number().int().min(0),
})

const deviceSchema = z.strictObject({
  id: z.string(),
  label: z.string(),
})

const outputDevicesSchema = z.strictObject({
  devices: z.array(deviceSchema),
  selected: z.string(),
})

export const scoreLoad = defineChannel('score:load', 'mainToRenderer', scoreSchema, nothing)

export const transportPlay = defineChannel('transport:play', 'rendererToMain', nothing, nothing)

export const transportStop = defineChannel('transport:stop', 'rendererToMain', nothing, nothing)

export const transportPosition = defineChannel(
  'transport:position',
  'rendererToMain',
  positionSchema,
  nothing,
)

export const engineError = defineChannel(
  'engine:error',
  'rendererToMain',
  z.strictObject({ code: z.string(), message: z.string() }),
  nothing,
)

export const outputVolume = defineChannel(
  'output:volume',
  'rendererToMain',
  z.strictObject({ gainDb: z.number().min(OUTPUT_GAIN_DB.min).max(OUTPUT_GAIN_DB.max) }),
  nothing,
)

export const outputMute = defineChannel(
  'output:mute',
  'rendererToMain',
  z.strictObject({ muted: z.boolean() }),
  nothing,
)

export const outputRestore = defineChannel(
  'output:restore',
  'mainToRenderer',
  z.strictObject({
    gainDb: z.number().min(OUTPUT_GAIN_DB.min).max(OUTPUT_GAIN_DB.max),
    muted: z.boolean(),
    deviceId: z.string(),
  }),
  nothing,
)

export const outputDevice = defineChannel(
  'output:device',
  'rendererToMain',
  z.strictObject({ id: z.string() }),
  outputDevicesSchema,
)

export const CHANNELS = [
  scoreLoad,
  transportPlay,
  transportStop,
  transportPosition,
  engineError,
  outputVolume,
  outputMute,
  outputDevice,
  outputRestore,
] as const

export type OutputDevices = z.infer<typeof outputDevicesSchema>

export type EnginePosition = z.infer<typeof positionSchema>
