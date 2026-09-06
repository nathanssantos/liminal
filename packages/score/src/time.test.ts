import { describe, expect, it } from 'vitest'
import { sixteenBars } from './fixtures/index.ts'
import { PPQ, SCORE_VERSION } from './index.ts'
import { barToTick, scoreLengthBars, scoreLengthTicks, sectionAt, tickToPosition } from './time.ts'

const SIGNATURES = [
  { beatsPerBar: 4, beatUnit: 4 },
  { beatsPerBar: 3, beatUnit: 4 },
  { beatsPerBar: 7, beatUnit: 8 },
]

describe('@liminal/score', () => {
  it('fixes 960 ticks per quarter note', () => {
    expect(PPQ).toBe(960)
  })

  it('declares the schema version the document carries', () => {
    expect(SCORE_VERSION).toBe(1)
  })
})

describe('tick arithmetic', () => {
  it('tickToPosition(barToTick(b)) returns bar b, beat 0, tick 0 for 0 ≤ b < 1000 in 4/4, 3/4 and 7/8', () => {
    for (const meter of SIGNATURES) {
      for (let bar = 0; bar < 1000; bar += 1) {
        expect(tickToPosition(barToTick(bar, meter), meter)).toEqual({ bar, beat: 0, tick: 0 })
      }
    }
  })

  it('keeps every bar an integer number of ticks in 4/4, 3/4 and 7/8', () => {
    for (const meter of SIGNATURES) {
      expect(Number.isInteger(barToTick(1, meter))).toBe(true)
    }
  })

  it('places a tick inside the bar on the right beat', () => {
    const meter = { beatsPerBar: 4, beatUnit: 4 }
    expect(tickToPosition(barToTick(2, meter) + PPQ + 120, meter)).toEqual({
      bar: 2,
      beat: 1,
      tick: 120,
    })
  })

  it('measures the score by the sum of its sections', () => {
    expect(scoreLengthBars(sixteenBars)).toBe(16)
    expect(scoreLengthTicks(sixteenBars)).toBe(16 * 4 * PPQ)
  })

  it('finds the section containing a tick and none past the end', () => {
    expect(sectionAt(sixteenBars, 0)?.role).toBe('drop')
    expect(sectionAt(sixteenBars, scoreLengthTicks(sixteenBars) - 1)?.role).toBe('drop')
    expect(sectionAt(sixteenBars, scoreLengthTicks(sixteenBars))).toBeUndefined()
  })
})
