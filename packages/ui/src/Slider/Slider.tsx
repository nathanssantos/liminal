import { Slider as RadixSlider } from 'radix-ui'
import {
  type CSSProperties,
  type KeyboardEvent,
  type Ref,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import './Slider.css'

export type SliderOrientation = 'horizontal' | 'vertical'
export type SliderValueVisibility = 'always' | 'while-changing' | 'never'
export type SliderSize = 'sm' | 'md'

export type SliderProps = {
  label: string
  value: number
  onValueChange: (value: number) => void
  min: number
  max: number
  onValueCommit?: (value: number) => void
  step?: number
  largeStep?: number
  format?: (value: number) => string
  orientation?: SliderOrientation
  showValue?: SliderValueVisibility
  ticks?: number[]
  size?: SliderSize
  disabled?: boolean
  disabledReason?: string
  className?: string
  id?: string
  ref?: Ref<HTMLSpanElement>
}

const LINGER_MS = 600

export function Slider({
  label,
  value,
  onValueChange,
  min,
  max,
  onValueCommit,
  step = 1,
  largeStep,
  format = String,
  orientation = 'horizontal',
  showValue = 'always',
  ticks,
  size = 'md',
  disabled = false,
  disabledReason,
  className,
  id,
  ref,
}: SliderProps) {
  const labelId = useId()
  const reasonId = useId()
  const [changing, setChanging] = useState(false)
  const lingerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const page = largeStep ?? step * 10
  const describedBy = disabled && disabledReason ? reasonId : undefined
  const valueText = format(value)

  useEffect(() => () => clearTimeout(lingerRef.current), [])

  function markChanging() {
    clearTimeout(lingerRef.current)
    setChanging(true)
  }

  function stopChanging() {
    clearTimeout(lingerRef.current)
    lingerRef.current = setTimeout(() => setChanging(false), LINGER_MS)
  }

  function onThumbKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key !== 'PageUp' && event.key !== 'PageDown') return
    event.preventDefault()
    event.stopPropagation()
    const next = Math.min(max, Math.max(min, value + (event.key === 'PageUp' ? page : -page)))
    markChanging()
    stopChanging()
    if (next !== value) onValueChange(next)
  }

  const valueVisible = showValue === 'always' || (showValue === 'while-changing' && changing)

  return (
    <div
      className={['lm-slider', className].filter(Boolean).join(' ')}
      data-orientation={orientation}
      data-size={size}
      {...(disabled ? { 'data-disabled': '' } : {})}
    >
      <div className="lm-slider-header">
        <span className="lm-slider-label" id={labelId}>
          {label}
        </span>
        <span className="lm-slider-value" aria-hidden="true">
          {valueVisible ? valueText : null}
        </span>
      </div>
      <RadixSlider.Root
        ref={ref}
        id={id}
        className="lm-slider-root"
        value={[value]}
        min={min}
        max={max}
        step={step}
        orientation={orientation}
        disabled={disabled}
        onValueChange={([next]) => {
          markChanging()
          if (next !== undefined) onValueChange(next)
        }}
        onValueCommit={([next]) => {
          stopChanging()
          if (next !== undefined) onValueCommit?.(next)
        }}
      >
        <RadixSlider.Track className="lm-slider-track">
          <RadixSlider.Range className="lm-slider-range" />
          {ticks?.map((tick) => (
            <span
              key={tick}
              className="lm-slider-tick"
              style={
                { '--lm-tick-offset': `${((tick - min) / (max - min)) * 100}%` } as CSSProperties
              }
            />
          ))}
        </RadixSlider.Track>
        <RadixSlider.Thumb
          className="lm-slider-thumb lm-focusable"
          aria-labelledby={labelId}
          aria-valuetext={valueText}
          onKeyDown={onThumbKeyDown}
          {...(describedBy ? { 'aria-describedby': describedBy } : {})}
        />
      </RadixSlider.Root>
      {describedBy ? (
        <span id={reasonId} className="lm-hidden-text">
          {disabledReason}
        </span>
      ) : null}
    </div>
  )
}
