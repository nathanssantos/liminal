import type { Ref } from 'react'
import './Readout.css'

export type ReadoutSize = 'md' | 'lg'

export type ReadoutLabels = {
  tempo: string
  key: string
  position: string
  elapsed: string
}

export type ReadoutProps = {
  tempo?: number | null
  musicalKey?: string | null
  bar?: number | null
  beat?: number | null
  elapsedMs?: number | null
  playing?: boolean
  size?: ReadoutSize
  labels?: ReadoutLabels
  className?: string
  id?: string
  ref?: Ref<HTMLDListElement>
}

const DEFAULT_LABELS: ReadoutLabels = {
  tempo: 'Tempo',
  key: 'Key',
  position: 'Bar',
  elapsed: 'Elapsed',
}

const MISSING = '—'
const NOT_AVAILABLE = 'not available'
const GROUP_LABEL = 'Now playing'
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const MS_PER_SECOND = 1000

export function formatElapsed(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / MS_PER_SECOND))
  const seconds = totalSeconds % SECONDS_PER_MINUTE
  const totalMinutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE)
  const minutes = totalMinutes % MINUTES_PER_HOUR
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR)
  const paddedSeconds = String(seconds).padStart(2, '0')
  if (hours === 0) return `${minutes}:${paddedSeconds}`
  return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSeconds}`
}

function Field({
  label,
  value,
  field,
  unit,
  live,
}: {
  label: string
  value: string | null
  field: string
  unit?: string
  live?: boolean
}) {
  const missing = value === null
  return (
    <div className="lm-readout-field" data-field={field}>
      <dt className="lm-readout-label">{label}</dt>
      <dd className="lm-readout-line">
        <span
          className="lm-readout-value"
          data-field={field}
          {...(live ? { 'data-live': '' } : {})}
          {...(missing ? { 'data-missing': '' } : {})}
        >
          {missing ? MISSING : value}
        </span>
        {missing ? <span className="lm-hidden-text">{NOT_AVAILABLE}</span> : null}
        {unit && !missing ? <span className="lm-readout-unit">{unit}</span> : null}
      </dd>
    </div>
  )
}

export function Readout({
  tempo = null,
  musicalKey = null,
  bar = null,
  beat = null,
  elapsedMs = null,
  playing = false,
  size = 'md',
  labels = DEFAULT_LABELS,
  className,
  id,
  ref,
}: ReadoutProps) {
  const position = bar === null || beat === null ? null : `${bar}:${beat}`
  return (
    <dl
      ref={ref}
      id={id}
      className={['lm-readout', className].filter(Boolean).join(' ')}
      data-size={size}
      aria-label={GROUP_LABEL}
    >
      <Field
        label={labels.tempo}
        value={tempo === null ? null : String(Math.round(tempo))}
        field="tempo"
        unit="BPM"
        live={playing}
      />
      <Field label={labels.key} value={musicalKey} field="key" />
      <Field label={labels.position} value={position} field="bar" />
      <Field
        label={labels.elapsed}
        value={elapsedMs === null ? null : formatElapsed(elapsedMs)}
        field="elapsed"
      />
    </dl>
  )
}
