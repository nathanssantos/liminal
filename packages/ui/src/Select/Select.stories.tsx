import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { Select, type SelectProps } from './Select.tsx'

const DEVICES = [
  { value: 'default', label: 'System default' },
  { value: 'built-in', label: 'Built-in speakers' },
  { value: 'interface', label: 'Scarlett 2i2' },
  { value: 'headphones', label: 'Headphones' },
]

const MANY_DEVICES = Array.from({ length: 24 }, (_, index) => ({
  value: `device-${index}`,
  label: `Output ${index + 1}`,
}))

function ControlledSelect({ value, onValueChange, ...rest }: SelectProps) {
  const [current, setCurrent] = useState(value)
  return (
    <Select
      {...rest}
      value={current}
      onValueChange={(next) => {
        setCurrent(next)
        onValueChange(next)
      }}
    />
  )
}

const meta = {
  title: 'Controls/Select',
  component: Select,
  parameters: { layout: 'padded' },
  args: { label: 'Output device', value: null, items: DEVICES, onValueChange: fn() },
  argTypes: {
    label: { control: 'text' },
    value: { control: 'text' },
    onValueChange: { action: 'valueChange' },
    items: { control: 'object' },
    hideLabel: { control: 'boolean' },
    placeholder: { control: 'text' },
    emptyLabel: { control: 'text' },
    loading: { control: 'boolean' },
    invalid: { control: 'boolean' },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      table: { defaultValue: { summary: 'md' } },
    },
    disabled: { control: 'boolean' },
    disabledReason: { control: 'text' },
    className: { control: false },
    id: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithValue: Story = { args: { value: 'interface' }, tags: ['evidence'] }
export const Open: Story = {
  render: (args) => <ControlledSelect {...args} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('combobox'))
    await screen.findByRole('listbox')
  },
}
export const WithDescriptions: Story = {
  args: {
    items: [
      { value: 'default', label: 'System default', description: 'Follows macOS' },
      { value: 'interface', label: 'Scarlett 2i2', description: '48 kHz · 2 channels' },
    ],
  },
}
export const Loading: Story = { args: { loading: true } }
export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('combobox')
    await userEvent.click(trigger)
    await expect(await screen.findByRole('listbox')).toHaveTextContent('Nothing to choose from')
  },
}
export const Invalid: Story = { args: { invalid: true, value: 'interface' } }
export const Disabled: Story = { args: { disabled: true } }
export const DisabledWithReason: Story = {
  args: { disabled: true, disabledReason: 'Stop the set before changing the device.' },
}
export const HiddenLabel: Story = { args: { hideLabel: true } }
export const SizeSmall: Story = { args: { size: 'sm' } }
export const SizeLarge: Story = { args: { size: 'lg' } }
export const ManyItems: Story = { args: { items: MANY_DEVICES } }
export const WithDisabledItem: Story = {
  args: {
    items: [
      { value: 'default', label: 'System default' },
      { value: 'cue', label: 'Cue output', disabled: true },
    ],
  },
}

export const KeyboardTypeAhead: Story = {
  render: (args) => <ControlledSelect {...args} />,
  play: async ({ args, canvasElement }) => {
    const trigger = within(canvasElement).getByRole('combobox')
    await userEvent.tab()
    await expect(trigger).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('Scar')
    await userEvent.keyboard('{Enter}')
    await expect(args.onValueChange).toHaveBeenCalledWith('interface')
    await expect(trigger).toHaveFocus()
  },
}
