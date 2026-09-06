import type { FxRef } from '@liminal/score'
import type { Ramped } from './automation.ts'
import { EngineError } from './errors.ts'
import type { NodeLedger } from './graph.ts'
import type { Tone, ToneContext, ToneNode } from './tone.ts'

export type Effect = {
  node: ToneNode
  cutoff?: Ramped
  quality?: Ramped
}

type Range = { min: number; max: number }

const asRamped = (signal: { value: unknown }): Ramped => signal as Ramped

const FILTER_PARAMS: Record<string, Range> = {
  cutoff: { min: 20, max: 20000 },
  q: { min: 0.0001, max: 100 },
}

const EQ3_PARAMS: Record<string, Range> = {
  low: { min: -60, max: 12 },
  mid: { min: -60, max: 12 },
  high: { min: -60, max: 12 },
  lowFrequency: { min: 20, max: 20000 },
  highFrequency: { min: 20, max: 20000 },
}

function refuseUnknown(
  kind: string,
  params: Record<string, number>,
  allowed: Record<string, Range>,
) {
  for (const [name, value] of Object.entries(params)) {
    const range = Object.hasOwn(allowed, name) ? allowed[name] : undefined
    if (range === undefined) {
      throw new EngineError('unknown-fx-param', `the ${kind} effect exposes no parameter ${name}`, {
        kind,
        param: name,
      })
    }
    if (value < range.min || value > range.max) {
      throw new EngineError(
        'unknown-fx-param',
        `the ${kind} effect takes ${name} between ${range.min} and ${range.max}, not ${value}`,
        { kind, param: name, value },
      )
    }
  }
}

export function createEffect(
  tone: Tone,
  context: ToneContext,
  ledger: NodeLedger,
  fx: FxRef,
): Effect {
  if (fx.kind === 'filter') {
    refuseUnknown('filter', fx.params, FILTER_PARAMS)
    const node = ledger.add(
      new tone.Filter({
        context,
        type: 'lowpass',
        frequency: fx.params.cutoff ?? 20000,
        Q: fx.params.q ?? 1,
      }),
    )
    return { node, cutoff: asRamped(node.frequency), quality: node.Q }
  }
  if (fx.kind === 'eq3') {
    refuseUnknown('eq3', fx.params, EQ3_PARAMS)
    const node = ledger.add(
      new tone.EQ3({
        context,
        low: fx.params.low ?? 0,
        mid: fx.params.mid ?? 0,
        high: fx.params.high ?? 0,
        lowFrequency: fx.params.lowFrequency ?? 400,
        highFrequency: fx.params.highFrequency ?? 2500,
      }),
    )
    return { node }
  }
  throw new EngineError('unsupported-fx', `the ${fx.kind} effect arrives after M1`, {
    kind: fx.kind,
  })
}
