import type { Score } from '@liminal/score'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App.tsx'
import { DEVICE_LOST } from './notices.ts'
import { AT_REST, SYSTEM_DEFAULT, useShell } from './store.ts'

const EXAMPLE = {
  tempo: { bpm: 128 },
  meter: { beatsPerBar: 4, beatUnit: 4 },
  key: { tonic: 'A', mode: 'minor' },
} as unknown as Score

function reset(state: Partial<ReturnType<typeof useShell.getState>> = {}): void {
  useShell.setState({
    score: undefined,
    transport: 'stopped',
    position: AT_REST,
    gainDb: -12,
    muted: false,
    devices: [SYSTEM_DEFAULT],
    deviceId: SYSTEM_DEFAULT.id,
    devicesPending: false,
    notice: undefined,
    loadTimedOut: false,
    ...state,
  })
}

beforeEach(() => reset())

describe('the shell before a set arrives', () => {
  it('says it is loading and refuses play, with a reason', () => {
    const { container } = render(<App />)
    expect(screen.getByText('Loading the set…')).toBeInTheDocument()
    expect(container.querySelector('.shell-hint')).toHaveTextContent('The set is still loading.')
    const play = screen.getByRole('button', { name: 'Play' })
    expect(play).toBeDisabled()
    expect(play).toHaveAccessibleDescription('The set is still loading.')
  })

  it('shows every number as not available rather than a zero', () => {
    render(<App />)
    expect(screen.getAllByText('not available')).toHaveLength(4)
  })

  it('says the load gave up, and still lets the volume work', () => {
    reset({ loadTimedOut: true })
    render(<App />)
    expect(screen.getByText('Nothing is loaded yet.')).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Volume' })).toBeEnabled()
  })
})

describe('the shell with a set ready', () => {
  it('names the set, invites the press, and shows the numbers', () => {
    reset({ score: EXAMPLE })
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Example set' })).toBeInTheDocument()
    expect(screen.getByText('Ready. Press play.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled()
  })

  it('refuses play when there is nothing to play through, and says why', () => {
    reset({ score: EXAMPLE, devices: [] })
    render(<App />)
    const play = screen.getByRole('button', { name: 'Play' })
    expect(play).toBeDisabled()
    expect(play).toHaveAccessibleDescription('Connect speakers or headphones first.')
    expect(
      screen.getByText('No output device. Connect speakers or headphones.'),
    ).toBeInTheDocument()
  })
})

describe('the shell while it plays', () => {
  it('keeps stop offered and explains why the main button cannot pause', () => {
    reset({ score: EXAMPLE, transport: 'playing' })
    render(<App />)
    const play = screen.getByRole('button', { name: 'Play' })
    expect(play).toBeDisabled()
    expect(play).toHaveAccessibleDescription('This set can only be stopped, not paused.')
    expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument()
  })

  it('offers play again, from the top, once the set has ended', () => {
    reset({ score: EXAMPLE, transport: 'ended' })
    render(<App />)
    expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled()
    expect(
      screen.getByText('The set reached the end. Press play to hear it again.'),
    ).toBeInTheDocument()
  })

  it('keeps the volume usable while muted, so unmuting is never a surprise', async () => {
    reset({ score: EXAMPLE, transport: 'playing', muted: true })
    render(<App />)
    expect(screen.getByRole('button', { name: 'Mute muted' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('slider', { name: 'Volume' })).toBeEnabled()
    await userEvent.tab()
    expect(document.activeElement).not.toBe(document.body)
  })
})

describe('the shell when something goes wrong', () => {
  it('says the device is gone in the listener words, and offers the way back', () => {
    reset({ score: EXAMPLE, notice: DEVICE_LOST })
    render(<App />)
    const strip = screen.getByRole('alert')
    expect(strip).toHaveTextContent('The output device is gone.')
    expect(strip).toHaveTextContent('The sound moved to the system default.')
    expect(screen.getByRole('button', { name: 'Choose a device' })).toBeInTheDocument()
  })

  it('sends focus to the device picker when the person asks to choose one', async () => {
    reset({ score: EXAMPLE, notice: DEVICE_LOST })
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Choose a device' }))
    expect(screen.getByRole('combobox', { name: 'Output' })).toHaveFocus()
  })

  it('closes the strip on dismiss and leaves focus on the transport, never on the body', async () => {
    reset({ score: EXAMPLE, notice: DEVICE_LOST })
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(document.activeElement).not.toBe(document.body)
  })

  it('shows no strip at all when nothing has gone wrong', () => {
    reset({ score: EXAMPLE })
    render(<App />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('the shell while the device list is busy', () => {
  it('marks the picker busy and does not open it', async () => {
    reset({ score: EXAMPLE, devicesPending: true })
    render(<App />)
    const picker = screen.getByRole('combobox', { name: 'Output' })
    expect(picker).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(picker)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('says there is no output device when the runtime offers none', () => {
    reset({ score: EXAMPLE, devices: [] })
    render(<App />)
    expect(screen.getByRole('combobox', { name: 'Output' })).toHaveTextContent('No output device')
  })
})

describe('what the whole screen announces', () => {
  it('has exactly two live regions, and neither is the hint', () => {
    reset({ score: EXAMPLE, transport: 'playing', notice: DEVICE_LOST })
    const { container } = render(<App />)
    expect(container.querySelectorAll('[aria-live]')).toHaveLength(1)
    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(1)
    expect(screen.getByText('Playing. This example is sixteen bars long.')).not.toHaveAttribute(
      'aria-live',
    )
  })

  it('reaches every control by keyboard, in the order the brief names', async () => {
    reset({ score: EXAMPLE })
    render(<App />)
    const reached: string[] = []
    for (let step = 0; step < 5; step += 1) {
      await userEvent.tab()
      const focused = document.activeElement
      reached.push(focused?.getAttribute('aria-label') ?? focused?.textContent ?? '')
    }
    expect(reached[0]).toContain('Play')
    expect(reached).toContainEqual(expect.stringContaining('Mute'))
  })
})
