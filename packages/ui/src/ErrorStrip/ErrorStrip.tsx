import type { RefObject } from 'react'
import { Button } from '../Button/Button.tsx'
import { AlertIcon, CloseIcon } from '../icons.tsx'
import './ErrorStrip.css'

export type ErrorStripTone = 'error' | 'warn'

export type ErrorStripAction = {
  label: string
  onAction: () => void
}

export type ErrorStripProps = {
  title: string
  detail?: string
  tone?: ErrorStripTone
  action?: ErrorStripAction
  onDismiss?: () => void
  focusOnDismiss?: RefObject<HTMLElement | null>
  className?: string
  id?: string
}

const DISMISS_LABEL = 'Dismiss'

export function ErrorStrip({
  title,
  detail,
  tone = 'error',
  action,
  onDismiss,
  focusOnDismiss,
  className,
  id,
}: ErrorStripProps) {
  return (
    <div
      id={id}
      className={['lm-error-strip', className].filter(Boolean).join(' ')}
      data-tone={tone}
      role="alert"
      aria-atomic="true"
    >
      <span className="lm-error-strip-rule" aria-hidden="true" />
      <AlertIcon className="lm-error-strip-icon" />
      <span className="lm-error-strip-text">
        <span className="lm-error-strip-title">{title}</span>
        {detail ? <span className="lm-error-strip-detail">{detail}</span> : null}
      </span>
      {action ? (
        <Button variant="quiet" size="sm" label={action.label} onClick={action.onAction} />
      ) : null}
      {onDismiss ? (
        <Button
          variant="quiet"
          size="sm"
          iconOnly
          label={DISMISS_LABEL}
          iconStart={<CloseIcon />}
          onClick={() => {
            onDismiss()
            focusOnDismiss?.current?.focus()
          }}
        />
      ) : null}
    </div>
  )
}
