import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { expect, within } from 'storybook/test'
import { Readout } from './Readout.tsx'

const meta = {
  title: 'Controls/Readout',
  component: Readout,
  args: { tempo: 128, musicalKey: 'F# min', bar: 17, beat: 3, elapsedMs: 154000 },
  argTypes: {
    tempo: { control: 'number' },
    musicalKey: { control: 'text' },
    bar: { control: 'number' },
    beat: { control: 'number' },
    elapsedMs: { control: 'number' },
    playing: { control: 'boolean' },
    size: { control: 'inline-radio', options: ['md', 'lg'] },
    labels: { control: 'object' },
    className: { control: false },
    id: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof Readout>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: { tempo: null, musicalKey: null, bar: null, beat: null, elapsedMs: null },
}
export const Stopped: Story = {}
export const Playing: Story = { args: { playing: true } }
export const PlayingLongValues: Story = {
  args: { playing: true, tempo: 128, bar: 1024, beat: 3, elapsedMs: 3849000 },
}
export const NoKey: Story = { args: { musicalKey: null } }
export const SizeLarge: Story = { args: { size: 'lg', playing: true } }
export const CustomLabels: Story = {
  args: { labels: { tempo: 'BPM', key: 'Key', position: 'Position', elapsed: 'Time' } },
}

function GrowingTempo() {
  const [tempo, setTempo] = useState(99)
  useEffect(() => {
    if (tempo === 99) setTempo(100)
    else if (tempo === 100) setTempo(128)
  }, [tempo])
  return <Readout playing tempo={tempo} musicalKey="F# min" bar={9} beat={4} elapsedMs={599000} />
}

export const DigitGrowth: Story = {
  render: () => <GrowingTempo />,
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByLabelText('Now playing')
    await expect(group).toHaveTextContent('128')
  },
}
