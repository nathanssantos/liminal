import type { EngineErrorCode } from '@liminal/engine'
import type { Notice } from './store.ts'

const UNPLAYABLE: EngineErrorCode[] = [
  'invalid-score',
  'unknown-preset',
  'unknown-instrument-param',
  'unknown-fx-param',
  'unsupported-fx',
  'automation-target-missing',
  'automation-out-of-range',
]

const WILL_NOT_START: EngineErrorCode[] = ['invalid-audio', 'context-in-use', 'context-not-offline']

export const DEVICE_LOST: Notice = {
  code: 'device-lost',
  title: 'The output device is gone.',
  detail: 'The sound moved to the system default.',
  tone: 'warn',
  action: 'choose-device',
}

export const SINK_UNAVAILABLE: Notice = {
  code: 'sink-unavailable',
  title: 'This computer cannot send the sound to another device.',
  detail: 'The set is playing on the system default.',
  tone: 'warn',
}

export const LOAD_GAVE_UP: Notice = {
  code: 'load-timeout',
  title: 'The set did not load.',
  detail: 'Reopen the app to try again.',
  tone: 'error',
}

export const BRIDGE_MISSING: Notice = {
  code: 'bridge-missing',
  title: 'The app cannot reach its own audio.',
  detail: 'Reopen the app to try again.',
  tone: 'error',
}

export const CHANNEL_REFUSED: Notice = {
  code: 'channel-refused',
  title: 'Something the app sent was not understood, so it was not applied.',
  tone: 'error',
}

const UNPLAYABLE_NOTICE: Notice = {
  code: 'unplayable',
  title: 'This set could not be played.',
  detail: 'Nothing was changed.',
  tone: 'error',
}

const WILL_NOT_START_NOTICE: Notice = {
  code: 'engine-will-not-start',
  title: 'The audio engine could not start.',
  tone: 'error',
}

const UNKNOWN_NOTICE: Notice = {
  code: 'unknown',
  title: 'The set stopped for a reason the app does not recognise.',
  tone: 'error',
}

export function noticeForCode(code: string): Notice {
  if (code === 'sink-unavailable') return SINK_UNAVAILABLE
  if ((UNPLAYABLE as string[]).includes(code)) return UNPLAYABLE_NOTICE
  if ((WILL_NOT_START as string[]).includes(code)) return WILL_NOT_START_NOTICE
  return UNKNOWN_NOTICE
}
