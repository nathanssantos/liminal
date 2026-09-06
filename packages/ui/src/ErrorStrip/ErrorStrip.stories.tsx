import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Button } from '../Button/Button.tsx'
import { ErrorStrip } from './ErrorStrip.tsx'

const LONG_TITLE =
  'We could not reach the audio device you chose, and the set stopped where it was.'

const meta = {
  title: 'Controls/ErrorStrip',
  component: ErrorStrip,
  parameters: { layout: 'padded' },
  args: { title: 'We could not reach the audio device.' },
  argTypes: {
    title: { control: 'text' },
    detail: { control: 'text' },
    tone: { control: 'inline-radio', options: ['error', 'warn'] },
    action: { control: 'object' },
    onDismiss: { action: 'dismiss' },
    focusOnDismiss: { control: false, description: 'Where focus goes after the strip closes' },
    className: { control: false },
    id: { control: false },
  },
} satisfies Meta<typeof ErrorStrip>

export default meta
type Story = StoryObj<typeof meta>

export const TitleOnly: Story = {}
export const WithDetail: Story = {
  args: { detail: 'The set stopped where it was.' },
}
export const WithAction: Story = {
  args: { action: { label: 'Try again', onAction: fn() } },
}
export const WithActionAndDismiss: Story = {
  args: { action: { label: 'Try again', onAction: fn() }, onDismiss: fn() },
}
export const WarnTone: Story = {
  args: {
    tone: 'warn',
    title: 'The analysis is taking longer than usual.',
    detail: 'The set keeps playing while we wait.',
  },
}
export const LongTitleWrapping: Story = {
  args: { title: LONG_TITLE, action: { label: 'Try again', onAction: fn() }, onDismiss: fn() },
}
export const DeviceLost: Story = {
  args: {
    title: 'We could not reach the audio device.',
    action: { label: 'Try again', onAction: fn() },
    onDismiss: fn(),
  },
}

function Dismissable({ onDismiss }: { onDismiss: () => void }) {
  const anchor = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(true)
  return (
    <div>
      <Button ref={anchor} label="Output device" />
      {open ? (
        <ErrorStrip
          title="We could not reach the audio device."
          action={{ label: 'Try again', onAction: () => {} }}
          focusOnDismiss={anchor}
          onDismiss={() => {
            setOpen(false)
            onDismiss()
          }}
        />
      ) : null}
    </div>
  )
}

export const KeyboardDismiss: Story = {
  args: { onDismiss: fn() },
  render: (args) => <Dismissable onDismiss={args.onDismiss ?? (() => {})} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }))
    await expect(args.onDismiss).toHaveBeenCalledTimes(1)
    await expect(canvas.getByRole('button', { name: 'Output device' })).toHaveFocus()
  },
}
