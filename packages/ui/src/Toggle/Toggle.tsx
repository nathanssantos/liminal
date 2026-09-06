import { Toggle as RadixToggle } from 'radix-ui'
import { type Ref, useId } from 'react'
import './Toggle.css'

export type ToggleTone = 'accent' | 'neutral' | 'warn'
export type ToggleSize = 'sm' | 'md' | 'lg'

export type ToggleProps = {
  label: string
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  tone?: ToggleTone
  size?: ToggleSize
  stateLabel?: { on: string; off: string }
  disabled?: boolean
  disabledReason?: string
  className?: string
  id?: string
  ref?: Ref<HTMLButtonElement>
}

const DEFAULT_STATE_LABEL = { on: 'on', off: 'off' }

export function Toggle({
  label,
  pressed,
  onPressedChange,
  tone = 'accent',
  size = 'md',
  stateLabel = DEFAULT_STATE_LABEL,
  disabled = false,
  disabledReason,
  className,
  id,
  ref,
}: ToggleProps) {
  const reasonId = useId()
  const describedBy = disabled && disabledReason ? reasonId : undefined

  const control = (
    <RadixToggle.Root
      ref={ref}
      id={id}
      className={['lm-toggle', 'lm-focusable', className].filter(Boolean).join(' ')}
      data-tone={tone}
      data-size={size}
      pressed={pressed}
      aria-label={`${label} ${pressed ? stateLabel.on : stateLabel.off}`}
      onPressedChange={onPressedChange}
      disabled={disabled}
      {...(describedBy ? { 'aria-describedby': describedBy } : {})}
    >
      <span className="lm-toggle-dot" aria-hidden="true" />
      <span className="lm-toggle-label">{label}</span>
    </RadixToggle.Root>
  )

  if (!describedBy) return control

  return (
    <>
      {control}
      <span id={reasonId} className="lm-hidden-text">
        {disabledReason}
      </span>
    </>
  )
}
