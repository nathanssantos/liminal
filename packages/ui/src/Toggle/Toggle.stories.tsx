import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Toggle } from './Toggle.tsx'

const meta = {
  title: 'Controls/Toggle',
  component: Toggle,
  args: { label: 'Mute', pressed: false, onPressedChange: fn() },
  argTypes: {
    label: { control: 'text' },
    pressed: { control: 'boolean' },
    onPressedChange: { action: 'pressedChange' },
    tone: {
      control: 'inline-radio',
      options: ['accent', 'neutral', 'warn'],
      table: { defaultValue: { summary: 'accent' } },
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      table: { defaultValue: { summary: 'md' } },
    },
    stateLabel: { control: 'object' },
    disabled: { control: 'boolean' },
    disabledReason: { control: 'text' },
    className: { control: false },
    id: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

export const Off: Story = {}
export const On: Story = { args: { pressed: true }, tags: ['evidence'] }
export const OnWarn: Story = { args: { pressed: true, tone: 'warn' } }
export const OnNeutral: Story = { args: { pressed: true, tone: 'neutral', label: 'Solo' } }
export const OffDisabled: Story = { args: { disabled: true } }
export const OnDisabled: Story = { args: { pressed: true, disabled: true } }
export const DisabledWithReason: Story = {
  args: { disabled: true, disabledReason: 'Nothing is playing yet.' },
}
export const SizeSmall: Story = { args: { size: 'sm' } }
export const SizeMedium: Story = { args: { size: 'md' } }
export const SizeLarge: Story = { args: { size: 'lg' } }
export const CustomStateLabel: Story = {
  args: { stateLabel: { on: 'muted', off: 'not muted' } },
}

export const KeyboardToggle: Story = {
  play: async ({ args, canvasElement }) => {
    const toggle = within(canvasElement).getByRole('button')
    await userEvent.tab()
    await expect(toggle).toHaveFocus()
    await userEvent.keyboard(' ')
    await userEvent.keyboard('{Enter}')
    await expect(args.onPressedChange).toHaveBeenCalledTimes(2)
  },
}
