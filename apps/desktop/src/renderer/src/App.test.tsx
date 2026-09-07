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
  it('offers one enabled button that says Stop, and nothing grey, while it plays', () => {
    reset({ score: EXAMPLE, transport: 'playing' })
    render(<App />)
    const stop = screen.getByRole('button', { name: 'Stop' })
    expect(stop).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument()
  })

  it('keeps the keyboard somewhere real when a strip is dismissed while playing', async () => {
    reset({ score: EXAMPLE, transport: 'playing', notice: DEVICE_LOST })
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(document.activeElement).not.toBe(document.body)
    expect(screen.getByRole('button', { name: 'Stop' })).toHaveFocus()
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
    expect(screen.getByRole('button', { name: 'Play' })).toHaveFocus()
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
  it('announces the transport word and the strip, and nothing else', () => {
    reset({ score: EXAMPLE, transport: 'playing', notice: DEVICE_LOST })
    const { container } = render(<App />)
    const live = [...container.querySelectorAll('[aria-live]')]
    expect(live).toHaveLength(1)
    expect(live[0]).toHaveTextContent('Playing')
    expect(live[0]).toHaveClass('lm-transport-word')
    const alerts = [...container.querySelectorAll('[role="alert"]')]
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toHaveClass('lm-error-strip')
    expect(screen.getByText('Playing. This example is sixteen bars long.')).not.toHaveAttribute(
      'aria-live',
    )
  })

  it('leaves a shortcut alone when it comes with a modifier', async () => {
    reset({ score: EXAMPLE })
    render(<App />)
    await userEvent.keyboard('{Meta>}m{/Meta}')
    expect(screen.getByRole('button', { name: 'Mute not muted' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await userEvent.keyboard('{Control>}5{/Control}')
    expect(screen.getByText('−12 dB')).toBeInTheDocument()
  })

  it('says it is starting the moment play is pressed, before any sound', () => {
    reset({ score: EXAMPLE, transport: 'starting' })
    const { container } = render(<App />)
    expect(container.querySelector('.lm-transport-word')).toHaveTextContent('Starting…')
    expect(screen.getByRole('button', { name: 'Starting…' })).toHaveAttribute(
      'aria-disabled',
      'true',
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

describe('the keys that work without the mouse, on the real screen', () => {
  it('mutes with M even while a button has focus', async () => {
    reset({ score: EXAMPLE })
    render(<App />)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Play' })).toHaveFocus()
    await userEvent.keyboard('m')
    expect(useShell.getState().muted).toBe(true)
  })

  it('moves the volume a decibel at a time with the arrows', async () => {
    reset({ score: EXAMPLE, gainDb: -12 })
    render(<App />)
    await userEvent.keyboard('{ArrowUp}')
    expect(useShell.getState().gainDb).toBe(-11)
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(useShell.getState().gainDb).toBe(-13)
  })

  it('jumps the volume with a digit', async () => {
    reset({ score: EXAMPLE })
    render(<App />)
    await userEvent.keyboard('0')
    expect(useShell.getState().gainDb).toBe(-60)
    await userEvent.keyboard('8')
    expect(useShell.getState().gainDb).toBe(-12)
  })

  it('never lets a nudge leave the range', async () => {
    reset({ score: EXAMPLE, gainDb: 0 })
    render(<App />)
    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    expect(useShell.getState().gainDb).toBe(0)
  })

  it('leaves the arrows alone when the volume slider itself has focus', async () => {
    reset({ score: EXAMPLE, gainDb: -12 })
    render(<App />)
    screen.getByRole('slider', { name: 'Volume' }).focus()
    await userEvent.keyboard('{ArrowUp}')
    expect(useShell.getState().gainDb).toBe(-11)
  })

  it('refuses Space when there is nothing to play', async () => {
    reset({ devices: [] })
    render(<App />)
    await userEvent.keyboard(' ')
    expect(useShell.getState().transport).toBe('stopped')
  })
})

describe('muting is a listener control, not a transport control', () => {
  it('leaves the transport playing and the position advancing', async () => {
    reset({ score: EXAMPLE, transport: 'playing', position: { bar: 2, beat: 1, tick: 0 } })
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Mute not muted' }))
    expect(useShell.getState().muted).toBe(true)
    expect(useShell.getState().transport).toBe('playing')
    expect(useShell.getState().position).toEqual({ bar: 2, beat: 1, tick: 0 })
    expect(screen.getByText('Playing. This example is sixteen bars long.')).toBeInTheDocument()
  })

  it('says muted in words, not only by colour', async () => {
    reset({ score: EXAMPLE, transport: 'playing' })
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Mute not muted' }))
    expect(screen.getByRole('button', { name: 'Mute muted' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
