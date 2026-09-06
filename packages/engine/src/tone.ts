import type * as ToneNamespace from 'tone'

export type Tone = typeof ToneNamespace

export type ToneContext = ToneNamespace.Context | ToneNamespace.OfflineContext

export type ToneNode = ToneNamespace.ToneAudioNode

export type ToneParam = ToneNamespace.Param<'decibels'> | ToneNamespace.Param<'frequency'>

export type RawContext = BaseAudioContext

export type EngineContext = RawContext | ToneContext

const isToneContext = (context: EngineContext): context is ToneContext =>
  'rawContext' in context && 'transport' in context

let pending: Promise<Tone> | undefined

export function loadTone(): Promise<Tone> {
  pending ??= import('tone')
  return pending
}

export type Wrapped = { context: ToneContext; owned: boolean }

const WRAPPERS = new WeakMap<BaseAudioContext, ToneContext>()

export function wrapContext(tone: Tone, context: EngineContext): Wrapped {
  if (isToneContext(context)) {
    return { context, owned: false }
  }
  const raw = context as BaseAudioContext
  const known = WRAPPERS.get(raw)
  if (known !== undefined) {
    if (!rendersOffline(raw)) {
      known.clockSource = 'timeout'
    }
    return { context: known, owned: true }
  }
  const made = rendersOffline(context)
    ? new tone.OfflineContext(context as OfflineAudioContext)
    : new tone.Context({ context: context as AudioContext, clockSource: 'timeout' })
  WRAPPERS.set(raw, made)
  return { context: made, owned: true }
}

export function rawContextOf(context: EngineContext): BaseAudioContext {
  return isToneContext(context) ? context.rawContext : context
}

export function rendersOffline(context: EngineContext): boolean {
  const raw = isToneContext(context) ? context.rawContext : context
  return typeof (raw as OfflineAudioContext).startRendering === 'function'
}
