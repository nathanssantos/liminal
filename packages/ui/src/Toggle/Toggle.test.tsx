import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Toggle } from './Toggle.tsx'

function Mute({ onPressedChange }: { onPressedChange?: (pressed: boolean) => void }) {
  const [pressed, setPressed] = useState(false)
  return (
    <Toggle
      label="Mute"
      tone="warn"
      pressed={pressed}
      onPressedChange={(next) => {
        setPressed(next)
        onPressedChange?.(next)
      }}
    />
  )
}

describe('Toggle', () => {
  it('flips its pressed state with Space and with Enter', async () => {
    const onPressedChange = vi.fn()
    render(<Mute onPressedChange={onPressedChange} />)
    const toggle = screen.getByRole('button')
    await userEvent.tab()
    expect(toggle).toHaveFocus()
    await userEvent.keyboard(' ')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await userEvent.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(onPressedChange).toHaveBeenCalledTimes(2)
  })

  it('speaks its state as words as well as aria-pressed', () => {
    render(
      <Toggle
        label="Mute"
        pressed
        stateLabel={{ on: 'muted', off: 'not muted' }}
        onPressedChange={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: 'Mute muted' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('refuses to toggle when disabled and explains why', async () => {
    const onPressedChange = vi.fn()
    render(
      <Toggle
        label="Mute"
        pressed={false}
        disabled
        disabledReason="Nothing is playing yet."
        onPressedChange={onPressedChange}
      />,
    )
    const toggle = screen.getByRole('button')
    expect(toggle).toBeDisabled()
    expect(toggle).toHaveAccessibleDescription('Nothing is playing yet.')
    await userEvent.click(toggle)
    expect(onPressedChange).not.toHaveBeenCalled()
  })
})
