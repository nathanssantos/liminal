import type { Automation, AutomationPoint, Curve } from '@liminal/score'
import { EngineError } from './errors.ts'

export type Ramped = {
  value: number
  getValueAtTime: (time: number) => number
  setValueAtTime: (value: number, time: number) => unknown
  linearRampToValueAtTime: (value: number, time: number) => unknown
  exponentialRampToValueAtTime: (value: number, time: number) => unknown
  cancelScheduledValues: (time: number) => unknown
}

export type AutomationTargetKind = 'positive' | 'signed'

export const MIN_EXPONENTIAL_VALUE = 1e-4

export type DowngradedCurve = { automationId: string; pointIndex: number }

export type Move = {
  atTransportSeconds: number
  apply: (param: Ramped, contextTime: number) => void
}

export function planAutomation(
  automation: Automation,
  staticValue: number,
  kind: AutomationTargetKind,
  points: readonly { point: AutomationPoint; seconds: number }[],
  downgraded: DowngradedCurve[],
): Move[] {
  const moves: Move[] = []
  let previousValue = staticValue
  let previousSeconds = 0
  points.forEach(({ point, seconds }, index) => {
    const curve = effectiveCurve(point.curve, kind, automation.id, index, downgraded)
    const value = point.value
    const from = previousValue
    const span = seconds - previousSeconds
    if (index === 0 || curve === 'step') {
      moves.push({
        atTransportSeconds: seconds,
        apply: (param, contextTime) => {
          param.setValueAtTime(value, contextTime)
        },
      })
    } else if (curve === 'linear') {
      moves.push({
        atTransportSeconds: previousSeconds,
        apply: (param, contextTime) => {
          param.setValueAtTime(from, contextTime)
          param.linearRampToValueAtTime(value, contextTime + span)
        },
      })
    } else {
      const lowestFrom = Math.max(from, MIN_EXPONENTIAL_VALUE)
      const lowestTo = Math.max(value, MIN_EXPONENTIAL_VALUE)
      moves.push({
        atTransportSeconds: previousSeconds,
        apply: (param, contextTime) => {
          param.setValueAtTime(lowestFrom, contextTime)
          param.exponentialRampToValueAtTime(lowestTo, contextTime + span)
        },
      })
    }
    previousValue = value
    previousSeconds = seconds
  })
  return moves
}

function effectiveCurve(
  curve: Curve,
  kind: AutomationTargetKind,
  automationId: string,
  pointIndex: number,
  downgraded: DowngradedCurve[],
): Curve {
  if (curve !== 'exp' || kind === 'positive') {
    return curve
  }
  downgraded.push({ automationId, pointIndex })
  return 'linear'
}

export function refuseOutOfRange(
  automation: Automation,
  point: AutomationPoint,
  lengthTicks: number,
): void {
  if (point.at > lengthTicks) {
    throw new EngineError(
      'automation-out-of-range',
      `automation ${automation.id} has a point at tick ${point.at}, past the score's ${lengthTicks}`,
      { automation: automation.id, at: point.at, length: lengthTicks },
    )
  }
}
