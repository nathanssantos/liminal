import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Transport } from './Transport.tsx'

const BEAT_MS = 469

const meta = {
  title: 'Controls/Transport',
  component: Transport,
  args: { state: 'stopped', onPlay: fn(), onPause: fn(), onStop: fn() },
  argTypes: {
    state: {
      control: 'inline-radio',
      options: ['stopped', 'starting', 'playing', 'paused'],
      table: { defaultValue: { summary: 'stopped' } },
    },
    onPlay: { action: 'play' },
    onPause: { action: 'pause' },
    onStop: { action: 'stop' },
    beatPulseKey: { control: 'number' },
    canPlay: { control: 'boolean' },
    canPause: { control: 'boolean' },
    disabledReason: { control: 'text' },
    labels: { control: 'object' },
    size: {
      control: 'inline-radio',
      options: ['md', 'lg'],
      table: { defaultValue: { summary: 'lg' } },
    },
    className: { control: false },
    id: { control: false },
    ref: { control: false },
    playRef: {
      control: false,
      description: 'The play button itself, for a consumer that must focus it',
    },
  },
} satisfies Meta<typeof Transport>

export default meta
type Story = StoryObj<typeof meta>

export const Stopped: Story = {}
export const Starting: Story = { args: { state: 'starting' } }
export const Playing: Story = { args: { state: 'playing' }, tags: ['evidence'] }
export const Paused: Story = { args: { state: 'paused' } }
export const SizeMedium: Story = { args: { state: 'playing', size: 'md' } }
export const CannotPause: Story = {
  args: {
    state: 'playing',
    canPause: false,
    disabledReason: 'This set can only be stopped, not paused.',
  },
}
export const CannotPlay: Story = {
  args: { canPlay: false, disabledReason: 'Choose an output device first.' },
}
export const CustomLabels: Story = {
  args: { labels: { play: 'Start', pause: 'Hold', stop: 'End' } },
}

function Beating() {
  const [beat, setBeat] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setBeat((current) => current + 1), BEAT_MS)
    return () => clearInterval(timer)
  }, [])
  return (
    <Transport
      state="playing"
      beatPulseKey={beat}
      onPlay={() => {}}
      onPause={() => {}}
      onStop={() => {}}
    />
  )
}

export const PlayingWithBeat: Story = { render: () => <Beating /> }

export const ReducedMotion: Story = { args: { state: 'playing', beatPulseKey: 1 } }

export const StopIsDeliberate: Story = {
  play: async ({ canvasElement }) => {
    const stop = within(canvasElement).getByRole('button', { name: 'Stop' })
    await expect(stop).toBeDisabled()
    await expect(stop).toHaveAccessibleDescription('Nothing is playing.')
  },
}

export const KeyboardTransport: Story = {
  args: { state: 'playing' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Pause' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(args.onPause).toHaveBeenCalledTimes(1)
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Stop' })).toHaveFocus()
    await userEvent.keyboard(' ')
    await expect(args.onStop).toHaveBeenCalledTimes(1)
  },
}
