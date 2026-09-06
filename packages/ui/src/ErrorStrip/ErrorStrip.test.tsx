import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '../Button/Button.tsx'
import { ErrorStrip } from './ErrorStrip.tsx'

function Recoverable({ onDismiss }: { onDismiss: () => void }) {
  const anchor = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(true)
  return (
    <div>
      <Button ref={anchor} label="Output device" />
      {open ? (
        <ErrorStrip
          title="We could not reach the audio device."
          action={{ label: 'Try again', onAction: () => {} }}
          dismissal={{
            focusOnDismiss: anchor,
            onDismiss: () => {
              setOpen(false)
              onDismiss()
            },
          }}
        />
      ) : null}
    </div>
  )
}

describe('ErrorStrip', () => {
  it('announces itself without stealing focus', () => {
    render(<ErrorStrip title="We could not reach the audio device." />)
    const strip = screen.getByRole('alert')
    expect(strip).toHaveTextContent('We could not reach the audio device.')
    expect(strip).toHaveAttribute('aria-atomic', 'true')
    expect(document.activeElement).toBe(document.body)
  })

  it('reaches the action and then the dismiss with Tab, and runs the action', async () => {
    const onAction = vi.fn()
    const onDismiss = vi.fn()
    render(
      <ErrorStrip
        title="We could not reach the audio device."
        action={{ label: 'Try again', onAction }}
        dismissal={{ onDismiss, focusOnDismiss: { current: null } }}
      />,
    )
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Try again' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onAction).toHaveBeenCalledTimes(1)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Dismiss' })).toHaveFocus()
  })

  it('leaves Escape to whatever else is open', async () => {
    const onDismiss = vi.fn()
    render(
      <ErrorStrip
        title="We could not reach the audio device."
        dismissal={{ onDismiss, focusOnDismiss: { current: null } }}
      />,
    )
    await userEvent.tab()
    await userEvent.keyboard('{Escape}')
    expect(onDismiss).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('moves focus before it unmounts, so the keyboard never lands on the body', async () => {
    const onDismiss = vi.fn()
    render(<Recoverable onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(document.activeElement).not.toBe(document.body)
  })

  it('sends focus where the consumer asked after it closes', async () => {
    const onDismiss = vi.fn()
    render(<Recoverable onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Output device' })).toHaveFocus()
  })

  it('has no dismiss button when the consumer gives no way to dismiss it', () => {
    render(<ErrorStrip title="We could not reach the audio device." />)
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument()
  })
})
