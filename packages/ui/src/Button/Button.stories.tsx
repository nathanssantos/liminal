import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { CheckIcon, ChevronDownIcon } from '../icons.tsx'
import { Button } from './Button.tsx'

const meta = {
  title: 'Controls/Button',
  component: Button,
  args: { label: 'Start the set', onClick: fn() },
  argTypes: {
    label: { control: 'text', description: 'The accessible name, and the visible text' },
    variant: {
      control: 'inline-radio',
      options: ['primary', 'quiet', 'danger'],
      table: { defaultValue: { summary: 'quiet' } },
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      table: { defaultValue: { summary: 'md' } },
    },
    iconStart: { control: false, description: 'A 16 px icon before the label' },
    iconEnd: { control: false, description: 'A 16 px icon after the label' },
    iconOnly: { control: 'boolean' },
    loading: { control: 'boolean' },
    busyLabel: { control: 'text' },
    disabled: { control: 'boolean' },
    disabledReason: { control: 'text' },
    asChild: { control: 'boolean' },
    children: { control: false, description: 'The element asChild renders as' },
    onClick: { action: 'click' },
    className: { control: false },
    id: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = { args: { variant: 'primary' }, tags: ['evidence'] }
export const PrimaryHover: Story = {
  args: { variant: 'primary' },
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole('button'))
  },
}
export const PrimaryPressed: Story = {
  args: { variant: 'primary' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button')
    await userEvent.pointer({ keys: '[MouseLeft>]', target: button })
  },
}
export const PrimaryDisabled: Story = { args: { variant: 'primary', disabled: true } }
export const PrimaryLoading: Story = {
  args: { variant: 'primary', loading: true, busyLabel: 'Starting…' },
}
export const Quiet: Story = { args: { variant: 'quiet' } }
export const QuietDisabled: Story = { args: { variant: 'quiet', disabled: true } }
export const Danger: Story = { args: { variant: 'danger', label: 'Discard the set' } }
export const DangerDisabled: Story = {
  args: { variant: 'danger', label: 'Discard the set', disabled: true },
}
export const WithIconStart: Story = { args: { iconStart: <CheckIcon /> } }
export const WithIconEnd: Story = { args: { iconEnd: <ChevronDownIcon /> } }
export const IconOnly: Story = { args: { iconOnly: true, label: 'Stop', iconStart: <CheckIcon /> } }
export const SizeSmall: Story = { args: { size: 'sm' } }
export const SizeMedium: Story = { args: { size: 'md' } }
export const SizeLarge: Story = { args: { size: 'lg' } }
export const AsChildLink: Story = {
  args: {
    asChild: true,
    label: 'Read the notes',
    children: <a href="https://example.invalid">Read the notes</a>,
  },
}
export const DisabledWithReason: Story = {
  args: { disabled: true, disabledReason: 'Choose an output device first.' },
}

export const KeyboardActivation: Story = {
  args: { variant: 'primary' },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole('button')
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    await expect(args.onClick).toHaveBeenCalledTimes(2)
  },
}

export const LoadingSwallowsActivation: Story = {
  args: { variant: 'primary', loading: true },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole('button')
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}
