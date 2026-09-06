import type { Channel } from '@liminal/protocol'
import {
  CHANNELS,
  engineError,
  outputDevice,
  outputMute,
  outputVolume,
  scoreLoad,
  transportPlay,
  transportPosition,
  transportStop,
} from '@liminal/protocol'
import type { z } from 'zod'

type AnyChannel = Channel<string, z.ZodTypeAny, z.ZodTypeAny>

export type Transport = {
  invoke: (name: string, payload: unknown) => Promise<unknown>
  subscribe: (name: string, listener: (payload: unknown) => void) => () => void
}

export class ChannelError extends Error {
  readonly channel: string

  readonly side: 'input' | 'output'

  constructor(channel: string, side: 'input' | 'output', detail: string) {
    super(`${channel} refused its ${side}: ${detail}`)
    this.name = 'ChannelError'
    this.channel = channel
    this.side = side
  }
}

const checked = <T>(channel: AnyChannel, side: 'input' | 'output', value: unknown): T => {
  const schema = side === 'input' ? channel.input : channel.output
  const seen = schema.safeParse(value)
  if (!seen.success) {
    throw new ChannelError(channel.name, side, seen.error.issues.map((i) => i.message).join('; '))
  }
  return seen.data as T
}

const sender =
  <C extends AnyChannel>(channel: C, transport: Transport) =>
  async (payload: z.infer<C['input']>): Promise<z.infer<C['output']>> => {
    const sent = checked<z.infer<C['input']>>(channel, 'input', payload)
    const answer = await transport.invoke(channel.name, sent)
    return checked<z.infer<C['output']>>(channel, 'output', answer)
  }

const receiver =
  <C extends AnyChannel>(channel: C, transport: Transport) =>
  (listener: (payload: z.infer<C['input']>) => void): (() => void) =>
    transport.subscribe(channel.name, (payload) => {
      listener(checked<z.infer<C['input']>>(channel, 'input', payload))
    })

export type Bridge = {
  onScore: ReturnType<typeof receiver<typeof scoreLoad>>
  play: ReturnType<typeof sender<typeof transportPlay>>
  stop: ReturnType<typeof sender<typeof transportStop>>
  reportPosition: ReturnType<typeof sender<typeof transportPosition>>
  reportError: ReturnType<typeof sender<typeof engineError>>
  setVolume: ReturnType<typeof sender<typeof outputVolume>>
  setMuted: ReturnType<typeof sender<typeof outputMute>>
  chooseDevice: ReturnType<typeof sender<typeof outputDevice>>
}

export function createBridge(transport: Transport): Bridge {
  return {
    onScore: receiver(scoreLoad, transport),
    play: sender(transportPlay, transport),
    stop: sender(transportStop, transport),
    reportPosition: sender(transportPosition, transport),
    reportError: sender(engineError, transport),
    setVolume: sender(outputVolume, transport),
    setMuted: sender(outputMute, transport),
    chooseDevice: sender(outputDevice, transport),
  }
}

export const CHANNEL_NAMES = CHANNELS.map((channel) => channel.name)
