import { SAFE_OUTPUT_GAIN_DB } from '@liminal/protocol'
import { sixteenBars } from '@liminal/score/fixtures'
import { describe, expect, it, vi } from 'vitest'
import type { Transport } from './bridge.ts'
import { ChannelError, createBridge } from './bridge.ts'

const transportThatAnswers = (answer: unknown = {}) => {
  const listeners = new Map<string, (payload: unknown) => void>()
  const invoke = vi.fn(async () => answer)
  const bridge = createBridge({
    invoke,
    subscribe: (name, listener) => {
      listeners.set(name, listener)
      return () => listeners.delete(name)
    },
  } satisfies Transport)
  return { bridge, invoke, listeners }
}

describe('the preload refuses what the schema does not allow', () => {
  it('throws before sending a payload outside the schema', async () => {
    const { bridge, invoke } = transportThatAnswers()

    await expect(bridge.setVolume({ gainDb: 12 })).rejects.toBeInstanceOf(ChannelError)
    expect(invoke).not.toHaveBeenCalled()
  })

  it('names the channel and the side it refused', async () => {
    const { bridge } = transportThatAnswers()

    await expect(bridge.setVolume({ gainDb: 12 })).rejects.toThrow(
      /output:volume refused its input/,
    )
  })

  it('sends a payload the schema allows', async () => {
    const { bridge, invoke } = transportThatAnswers()

    await bridge.setVolume({ gainDb: SAFE_OUTPUT_GAIN_DB })

    expect(invoke).toHaveBeenCalledWith('output:volume', { gainDb: SAFE_OUTPUT_GAIN_DB })
  })

  it('throws when the answer is outside the schema, rather than handing it on', async () => {
    const { bridge } = transportThatAnswers({ devices: [{ id: 'a' }], selected: 'a' })

    await expect(bridge.chooseDevice({ id: 'a' })).rejects.toThrow(
      /output:device refused its output/,
    )
  })

  it('refuses a document that arrives with the wrong shape', () => {
    const { bridge, listeners } = transportThatAnswers()
    const seen = vi.fn()
    bridge.onScore(seen)

    expect(() => listeners.get('score:load')?.({ ...sixteenBars, tempo: { bpm: 'fast' } })).toThrow(
      /score:load refused its input/,
    )
    expect(seen).not.toHaveBeenCalled()
  })

  it('hands on a document that arrives whole', () => {
    const { bridge, listeners } = transportThatAnswers()
    const seen = vi.fn()
    bridge.onScore(seen)

    listeners.get('score:load')?.(sixteenBars)

    expect(seen).toHaveBeenCalledWith(sixteenBars)
  })

  it('stops listening when the subscription is released', () => {
    const { bridge, listeners } = transportThatAnswers()
    const release = bridge.onScore(vi.fn())

    release()

    expect(listeners.has('score:load')).toBe(false)
  })
})
