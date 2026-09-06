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
  onPause: () => void
  onStop: () => void
  beatPulseKey?: number
  canPlay?: boolean
  disabledReason?: string
  labels?: TransportLabels
  size?: TransportSize
  className?: string
  id?: string
  ref?: Ref<HTMLDivElement>
}

const DEFAULT_LABELS: TransportLabels = { play: 'Play', pause: 'Pause', stop: 'Stop' }

const STATE_WORD: Record<TransportState, string> = {
  stopped: 'Stopped',
  starting: 'Starting…',
  playing: 'Playing',
  paused: 'Paused',
}

const NOTHING_IS_PLAYING = 'Nothing is playing.'

export function Transport({
  state,
  onPlay,
  onPause,
  onStop,
  beatPulseKey,
  canPlay = true,
  disabledReason,
  labels = DEFAULT_LABELS,
  size = 'lg',
  className,
  id,
  ref,
}: TransportProps) {
  const playing = state === 'playing'
  const buttonSize = size === 'lg' ? 'lg' : 'md'
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
        variant="primary"
        size={buttonSize}
        label={playing ? labels.pause : labels.play}
        iconStart={playing ? <PauseIcon /> : <PlayIcon />}
        loading={state === 'starting'}
        busyLabel={STATE_WORD.starting}
        disabled={!canPlay && !playing}
        {...(disabledReason === undefined ? {} : { disabledReason })}
        onClick={playing ? onPause : onPlay}
      />
      <Button
        variant="quiet"
        size={buttonSize}
        iconOnly
        label={labels.stop}
        iconStart={<StopIcon />}
        disabled={stopDisabled}
        {...(stopDisabled ? { disabledReason: NOTHING_IS_PLAYING } : {})}
        onClick={onStop}
      />
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
