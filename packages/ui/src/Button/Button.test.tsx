import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button.tsx'

describe('Button', () => {
  it('activates with Enter and with Space when focused by keyboard', async () => {
    const onClick = vi.fn()
    render(<Button label="Play" onClick={onClick} />)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Play' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('keeps focus while loading and refuses to activate', async () => {
    const onClick = vi.fn()
    render(<Button label="Play" loading busyLabel="Starting…" onClick={onClick} />)
    const button = screen.getByRole('button')
    await userEvent.tab()
    expect(button).toHaveFocus()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveTextContent('Starting…')
    await userEvent.keyboard('{Enter}')
    expect(onClick).not.toHaveBeenCalled()
  })

  it('is skipped by Tab when disabled and explains why to a screen reader', async () => {
    render(<Button label="Play" disabled disabledReason="Choose an output device first." />)
    const button = screen.getByRole('button', { name: 'Play' })
    expect(button).toBeDisabled()
    expect(button).toHaveAccessibleDescription('Choose an output device first.')
    await userEvent.tab()
    expect(button).not.toHaveFocus()
  })

  it('names an icon-only button by its label', () => {
    render(<Button label="Stop" iconOnly />)
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
  })

  it('renders the consumer element when asChild, keeping the button look', () => {
    render(
      <Button asChild label="Read the notes">
        <a href="https://example.invalid">Read the notes</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Read the notes' })
    expect(link).toHaveClass('lm-button')
  })
})
