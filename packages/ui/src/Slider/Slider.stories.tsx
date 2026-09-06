import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Slider, type SliderProps } from './Slider.tsx'

const decibels = (value: number) => `${value} dB`

function ControlledSlider({ value, onValueChange, ...rest }: SliderProps) {
  const [current, setCurrent] = useState(value)
  return (
    <Slider
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
  title: 'Controls/Slider',
  component: Slider,
  parameters: { layout: 'padded' },
  args: { label: 'Level', value: 40, min: 0, max: 100, onValueChange: fn() },
  argTypes: {
    label: { control: 'text' },
    value: { control: 'number' },
    onValueChange: { action: 'valueChange' },
    min: { control: 'number' },
    max: { control: 'number' },
    onValueCommit: { action: 'valueCommit' },
    step: { control: 'number' },
    largeStep: { control: 'number' },
    format: { control: false, description: 'Turns the number into the words a person reads' },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    showValue: { control: 'inline-radio', options: ['always', 'while-changing', 'never'] },
    ticks: { control: 'object' },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    disabled: { control: 'boolean' },
    disabledReason: { control: 'text' },
    className: { control: false },
    id: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Volume: Story = {
  args: { label: 'Volume', value: -12, min: -60, max: 0, format: decibels, ticks: [-12] },
  tags: ['evidence'],
}
export const VolumeMuted: Story = {
  args: {
    label: 'Volume',
    value: -60,
    min: -60,
    max: 0,
    format: (value) => (value <= -60 ? 'muted' : decibels(value)),
  },
}
export const WithTicks: Story = { args: { ticks: [0, 25, 50, 75, 100] } }
export const Vertical: Story = { args: { orientation: 'vertical' } }
export const ShowValueWhileChanging: Story = { args: { showValue: 'while-changing' } }
export const ShowValueNever: Story = { args: { showValue: 'never' } }
export const SizeSmall: Story = { args: { size: 'sm' } }
export const Disabled: Story = { args: { disabled: true } }
export const DisabledWithReason: Story = {
  args: { disabled: true, disabledReason: 'Start the set before changing the level.' },
}
export const LargeStep: Story = { args: { largeStep: 25 } }

export const KeyboardSteps: Story = {
  args: { label: 'Volume', value: -12, min: -60, max: 0, step: 1, format: decibels },
  render: (args) => <ControlledSlider {...args} />,
  play: async ({ canvasElement }) => {
    const thumb = within(canvasElement).getByRole('slider')
    await userEvent.tab()
    await expect(thumb).toHaveFocus()
    await userEvent.keyboard('{Home}')
    await expect(thumb).toHaveAttribute('aria-valuenow', '-60')
    await userEvent.keyboard('{End}')
    await expect(thumb).toHaveAttribute('aria-valuenow', '0')
    await expect(thumb).toHaveAttribute('aria-valuetext', '0 dB')
  },
}
