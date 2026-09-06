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

const FILTER_PARAMS = ['cutoff', 'q'] as const

const EQ3_PARAMS = ['low', 'mid', 'high', 'lowFrequency', 'highFrequency'] as const

function refuseUnknown(kind: string, params: Record<string, number>, allowed: readonly string[]) {
  for (const name of Object.keys(params)) {
    if (!allowed.includes(name)) {
      throw new EngineError('unknown-fx-param', `the ${kind} effect exposes no parameter ${name}`, {
        kind,
        param: name,
      })
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
    return {
      node,
      cutoff: node.frequency as unknown as Ramped,
      quality: node.Q as unknown as Ramped,
    }
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
