import type { Ref } from 'react'
import { Button } from '../Button/Button.tsx'
import { PauseIcon, PlayIcon, StopIcon } from '../icons.tsx'
import './Transport.css'

export type TransportState = 'stopped' | 'starting' | 'playing' | 'paused'
export type TransportSize = 'md' | 'lg'

export type TransportLabels = {
  play: string
  pause: string
  stop: string
}

export type TransportProps = {
  state: TransportState
  onPlay: () => void
  onPause?: () => void
  onStop: () => void
  beatPulseKey?: number
  canPlay?: boolean
  canPause?: boolean
  stopOnly?: boolean
  disabledReason?: string
  labels?: TransportLabels
  size?: TransportSize
  className?: string
  id?: string
  ref?: Ref<HTMLDivElement>
  playRef?: Ref<HTMLButtonElement>
}

const DEFAULT_LABELS: TransportLabels = { play: 'Play', pause: 'Pause', stop: 'Stop' }

const STATE_WORD: Record<TransportState, string> = {
  stopped: 'Stopped',
  starting: 'Starting…',
  playing: 'Playing',
  paused: 'Paused',
}

const NOTHING_IS_PLAYING = 'Nothing is playing.'

function mainLabel(labels: TransportLabels, offersStop: boolean, offersPause: boolean): string {
  if (offersStop) return labels.stop
  return offersPause ? labels.pause : labels.play
}

function mainAction(given: {
  offersStop: boolean
  offersPause: boolean
  onStop: () => void
  onPause: (() => void) | undefined
  onPlay: () => void
}): () => void {
  if (given.offersStop) return given.onStop
  if (given.offersPause && given.onPause) return given.onPause
  return given.onPlay
}

function mainIcon(offersStop: boolean, offersPause: boolean) {
  if (offersStop) return <StopIcon />
  return offersPause ? <PauseIcon /> : <PlayIcon />
}

export function Transport({
  state,
  onPlay,
  onPause,
  onStop,
  beatPulseKey,
  canPlay = true,
  canPause = true,
  stopOnly = false,
  disabledReason,
  labels = DEFAULT_LABELS,
  size = 'lg',
  className,
  id,
  ref,
  playRef,
}: TransportProps) {
  const playing = state === 'playing'
  const offersStop = playing && stopOnly
  const offersPause = playing && !stopOnly && canPause
  const mainDisabled = playing ? !stopOnly && !canPause : !canPlay
  const stopDisabled = state === 'stopped'

  return (
    <div
      ref={ref}
      id={id}
      className={['lm-transport', className].filter(Boolean).join(' ')}
      data-size={size}
      data-state={state}
    >
      <Button
        {...(playRef === undefined ? {} : { ref: playRef })}
        variant="primary"
        size={size}
        label={mainLabel(labels, offersStop, offersPause)}
        iconStart={mainIcon(offersStop, offersPause)}
        loading={state === 'starting'}
        busyLabel={STATE_WORD.starting}
        disabled={mainDisabled}
        {...(disabledReason === undefined ? {} : { disabledReason })}
        onClick={mainAction({ offersStop, offersPause, onStop, onPause, onPlay })}
      />
      {stopOnly ? null : (
        <Button
          variant="quiet"
          size={size}
          iconOnly
          label={labels.stop}
          iconStart={<StopIcon />}
          disabled={stopDisabled}
          {...(stopDisabled ? { disabledReason: NOTHING_IS_PLAYING } : {})}
          onClick={onStop}
        />
      )}
      <span className="lm-transport-chip">
        <span
          key={beatPulseKey}
          className="lm-transport-shape"
          data-shape={state}
          {...(beatPulseKey === undefined ? {} : { 'data-pulse': '' })}
          aria-hidden="true"
        />
        <span className="lm-transport-word" aria-live="polite" aria-atomic="true">
          {STATE_WORD[state]}
        </span>
      </span>
    </div>
  )
}
