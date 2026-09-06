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

export function scheduleAutomation(
  automation: Automation,
  param: Ramped,
  kind: AutomationTargetKind,
  points: readonly { point: AutomationPoint; seconds: number }[],
  downgraded: DowngradedCurve[],
): void {
  let previousValue = param.value
  let previousSeconds = 0
  points.forEach(({ point, seconds }, index) => {
    const curve = effectiveCurve(point.curve, kind, automation.id, index, downgraded)
    if (curve === 'step') {
      param.setValueAtTime(point.value, seconds)
    } else if (curve === 'linear') {
      param.setValueAtTime(previousValue, previousSeconds)
      param.linearRampToValueAtTime(point.value, seconds)
    } else {
      const from = Math.max(previousValue, MIN_EXPONENTIAL_VALUE)
      const to = Math.max(point.value, MIN_EXPONENTIAL_VALUE)
      param.setValueAtTime(from, previousSeconds)
      param.exponentialRampToValueAtTime(to, seconds)
    }
    previousValue = point.value
    previousSeconds = seconds
  })
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
