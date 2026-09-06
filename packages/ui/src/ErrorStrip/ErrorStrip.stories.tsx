import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Button } from '../Button/Button.tsx'
import { ErrorStrip } from './ErrorStrip.tsx'

const LONG_TITLE =
  'We could not reach the audio device you chose, the set stopped where it was, and nothing has ' +
  'been lost — the queue, the plan and everything already rendered are still here waiting for you.'

const meta = {
  title: 'Controls/ErrorStrip',
  component: ErrorStrip,
  parameters: { layout: 'padded' },
  args: { title: 'We could not reach the audio device.' },
  argTypes: {
    title: { control: 'text' },
    detail: { control: 'text' },
    tone: {
      control: 'inline-radio',
      options: ['error', 'warn'],
      table: { defaultValue: { summary: 'error' } },
    },
    action: { control: 'object' },
    dismissal: {
      control: false,
      description: 'How the strip closes, and where focus goes when it does',
    },
    className: { control: false },
    id: { control: false },
    ref: { control: false, description: 'The strip element, for a consumer that must reach it' },
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
  args: {
    action: { label: 'Try again', onAction: fn() },
    dismissal: { onDismiss: fn(), focusOnDismiss: { current: null } },
  },
  tags: ['evidence'],
}
export const WarnTone: Story = {
  args: {
    tone: 'warn',
    title: 'The analysis is taking longer than usual.',
    detail: 'The set keeps playing while we wait.',
  },
}
export const LongTitleWrapping: Story = {
  args: {
    title: LONG_TITLE,
    action: { label: 'Try again', onAction: fn() },
    dismissal: { onDismiss: fn(), focusOnDismiss: { current: null } },
  },
}
export const DeviceLost: Story = {
  args: {
    title: 'We could not reach the audio device.',
    action: { label: 'Try again', onAction: fn() },
    dismissal: { onDismiss: fn(), focusOnDismiss: { current: null } },
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

export const KeyboardDismiss: Story = {
  args: { dismissal: { onDismiss: fn(), focusOnDismiss: { current: null } } },
  render: (args) => <Dismissable onDismiss={args.dismissal?.onDismiss ?? (() => {})} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }))
    await expect(args.dismissal?.onDismiss).toHaveBeenCalledTimes(1)
    await expect(canvas.getByRole('button', { name: 'Output device' })).toHaveFocus()
  },
}
