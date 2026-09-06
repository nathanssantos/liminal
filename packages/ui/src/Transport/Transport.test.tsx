import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Transport, type TransportProps, type TransportState } from './Transport.tsx'

function setup(state: TransportState, extra: Partial<TransportProps> = {}) {
  const handlers = { onPlay: vi.fn(), onPause: vi.fn(), onStop: vi.fn() }
  render(<Transport state={state} {...handlers} {...extra} />)
  return handlers
}

describe('Transport', () => {
  it('offers Play when stopped and Pause when playing', () => {
    const { unmount } = render(
      <Transport state="stopped" onPlay={() => {}} onPause={() => {}} onStop={() => {}} />,
    )
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    unmount()
    render(<Transport state="playing" onPlay={() => {}} onPause={() => {}} onStop={() => {}} />)
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
  })

  it('reaches play then stop with Tab, and activates both from the keyboard', async () => {
    const handlers = setup('playing')
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Pause' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(handlers.onPause).toHaveBeenCalledTimes(1)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Stop' })).toHaveFocus()
    await userEvent.keyboard(' ')
    expect(handlers.onStop).toHaveBeenCalledTimes(1)
  })

  it('says its state in words, not only in colour', () => {
    const { unmount } = render(
      <Transport state="paused" onPlay={() => {}} onPause={() => {}} onStop={() => {}} />,
    )
    expect(screen.getByText('Paused')).toBeInTheDocument()
    unmount()
    const { container } = render(
      <Transport state="starting" onPlay={() => {}} onPause={() => {}} onStop={() => {}} />,
    )
    expect(container.querySelector('[aria-live]')).toHaveTextContent('Starting…')
  })

  it('refuses to stop what is not playing, and says why', () => {
    setup('stopped')
    const stop = screen.getByRole('button', { name: 'Stop' })
    expect(stop).toBeDisabled()
    expect(stop).toHaveAccessibleDescription('Nothing is playing.')
  })

  it('refuses to play when it cannot, and says why', async () => {
    const handlers = setup('stopped', {
      canPlay: false,
      disabledReason: 'Choose an output device first.',
    })
    const play = screen.getByRole('button', { name: 'Play' })
    expect(play).toBeDisabled()
    expect(play).toHaveAccessibleDescription('Choose an output device first.')
    await userEvent.click(play)
    expect(handlers.onPlay).not.toHaveBeenCalled()
  })

  it('swallows activation while starting', async () => {
    const handlers = setup('starting')
    const play = screen.getByRole('button', { name: 'Starting…' })
    expect(play).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(play)
    expect(handlers.onPlay).not.toHaveBeenCalled()
  })

  it('announces its state once, and never on a beat', () => {
    const { container, rerender } = render(
      <Transport
        state="playing"
        beatPulseKey={1}
        onPlay={() => {}}
        onPause={() => {}}
        onStop={() => {}}
      />,
    )
    const live = container.querySelectorAll('[aria-live]')
    expect(live).toHaveLength(1)
    expect(live[0]).toHaveTextContent('Playing')
    rerender(
      <Transport
        state="playing"
        beatPulseKey={2}
        onPlay={() => {}}
        onPause={() => {}}
        onStop={() => {}}
      />,
    )
    expect(container.querySelector('[aria-live]')).toHaveTextContent('Playing')
  })
})
