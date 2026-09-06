import { sixteenBars } from '@liminal/score/fixtures'
import { afterAll, describe, expect, it } from 'vitest'
import { createEngine } from './engine.ts'
import { barSeconds } from './time.ts'

const BARS_TO_HEAR = 2

const openContext = (): AudioContext | undefined => {
  try {
    return new AudioContext({ sampleRate: 48000 })
  } catch {
    return undefined
  }
}

const context = openContext()

describe.skipIf(context === undefined)('the wall clock drives the transport', () => {
  afterAll(async () => {
    await context?.close()
  })

  it('emits a bar per bar in real time, in order', async () => {
    if (context === undefined) {
      return
    }
    const engine = await createEngine({ context, score: sixteenBars })
    const seen: number[] = []
    engine.on('bar', (event) => {
      if (event !== undefined) {
        seen.push(event.bar)
      }
    })
    engine.play()
    await new Promise((resolve) => {
      setTimeout(resolve, barSeconds(sixteenBars) * BARS_TO_HEAR * 1000)
    })
    engine.stop()
    engine.dispose()
    expect(seen.length).toBeGreaterThanOrEqual(BARS_TO_HEAR)
    expect(seen).toEqual([...seen].toSorted((left, right) => left - right))
    expect(seen[0]).toBe(0)
  })
})
