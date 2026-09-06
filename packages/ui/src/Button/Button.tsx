import { Slot } from 'radix-ui'
import { type MouseEvent, type ReactNode, type Ref, useId } from 'react'
import { SpinnerIcon } from '../icons.tsx'
import './Button.css'

export type ButtonVariant = 'primary' | 'quiet' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = {
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
  iconStart?: ReactNode
  iconEnd?: ReactNode
  iconOnly?: boolean
  loading?: boolean
  busyLabel?: string
  disabled?: boolean
  disabledReason?: string
  type?: 'button' | 'submit'
  asChild?: boolean
  children?: ReactNode
  onClick?: (event: MouseEvent<HTMLElement>) => void
  className?: string
  id?: string
  ref?: Ref<HTMLButtonElement>
}

export function Button({
  label,
  variant = 'quiet',
  size = 'md',
  iconStart,
  iconEnd,
  iconOnly = false,
  loading = false,
  busyLabel = 'Working…',
  disabled = false,
  disabledReason,
  type = 'button',
  asChild = false,
  children,
  onClick,
  className,
  id,
  ref,
}: ButtonProps) {
  const reasonId = useId()
  const describedBy = disabled && disabledReason ? reasonId : undefined
  const reason = describedBy ? (
    <span id={reasonId} className="lm-hidden-text">
      {disabledReason}
    </span>
  ) : null

  const shared = {
    id,
    className: ['lm-button', 'lm-focusable', className].filter(Boolean).join(' '),
    'data-variant': variant,
    'data-size': size,
    ...(iconOnly ? { 'data-icon-only': '' } : {}),
    ...(loading ? { 'data-loading': '', 'aria-busy': true, 'aria-disabled': true } : {}),
    ...(disabled ? { 'data-disabled': '' } : {}),
    ...(iconOnly ? { 'aria-label': label } : {}),
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
    onClick: (event: MouseEvent<HTMLElement>) => {
      if (loading) {
        event.preventDefault()
        return
      }
      onClick?.(event)
    },
  }

  const leading = loading ? <SpinnerIcon className="lm-spin" /> : iconStart
  const trailing = loading ? null : iconEnd

  const control = asChild ? (
    <Slot.Root {...shared} {...(disabled ? { 'aria-disabled': true } : {})}>
      {leading}
      <Slot.Slottable>{children}</Slot.Slottable>
      {trailing}
    </Slot.Root>
  ) : (
    <button {...shared} ref={ref} type={type} disabled={disabled}>
      {leading}
      {iconOnly ? null : <span className="lm-button-label">{loading ? busyLabel : label}</span>}
      {trailing}
    </button>
  )

  if (!reason) return control

  return (
    <>
      {control}
      {reason}
    </>
  )
}
