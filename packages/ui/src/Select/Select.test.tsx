import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Select, type SelectItem } from './Select.tsx'

const DEVICES: SelectItem[] = [
  { value: 'default', label: 'System default' },
  { value: 'built-in', label: 'Built-in speakers' },
  { value: 'interface', label: 'Scarlett 2i2' },
]

function Devices({
  items = DEVICES,
  onValueChange,
}: {
  items?: SelectItem[]
  onValueChange?: (value: string) => void
}) {
  const [value, setValue] = useState<string | null>(null)
  return (
    <Select
      label="Output device"
      items={items}
      value={value}
      onValueChange={(next) => {
        setValue(next)
        onValueChange?.(next)
      }}
    />
  )
}

describe('Select', () => {
  it('opens with the arrow keys and commits the arrowed-to option with Enter', async () => {
    const onValueChange = vi.fn()
    render(<Devices onValueChange={onValueChange} />)
    const trigger = screen.getByRole('combobox', { name: 'Output device' })
    await userEvent.tab()
    expect(trigger).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(await screen.findByRole('listbox')).toBeInTheDocument()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('built-in')
    expect(trigger).toHaveFocus()
  })

  it('selects by typed prefix', async () => {
    const onValueChange = vi.fn()
    render(<Devices onValueChange={onValueChange} />)
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    await screen.findByRole('listbox')
    await userEvent.keyboard('Scar')
    await userEvent.keyboard('{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('interface')
  })

  it('jumps to the ends with Home and End', async () => {
    const onValueChange = vi.fn()
    const { unmount } = render(<Devices onValueChange={onValueChange} />)
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    await screen.findByRole('listbox')
    await userEvent.keyboard('{End}{Enter}')
    expect(onValueChange).toHaveBeenLastCalledWith('interface')
    unmount()

    render(<Devices onValueChange={onValueChange} />)
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    await screen.findByRole('listbox')
    await userEvent.keyboard('{End}{Home}{Enter}')
    expect(onValueChange).toHaveBeenLastCalledWith('default')
  })

  it('keeps showing what the consumer accepted, never what it only clicked', async () => {
    const { rerender } = render(
      <Select label="Output device" items={DEVICES} value="interface" onValueChange={() => {}} />,
    )
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveTextContent('Scarlett 2i2')
    rerender(<Select label="Output device" items={DEVICES} value={null} onValueChange={() => {}} />)
    expect(trigger).toHaveTextContent('Choose…')
  })

  it('refuses to open, and says so on the trigger, while the list is loading', async () => {
    render(
      <Select
        label="Output device"
        items={DEVICES}
        value={null}
        loading
        onValueChange={() => {}}
      />,
    )
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('aria-busy', 'true')
    expect(trigger).toHaveAttribute('aria-disabled', 'true')
    await userEvent.tab()
    expect(trigger).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('marks itself invalid for a screen reader, not only with a colour', () => {
    render(
      <Select
        label="Output device"
        items={DEVICES}
        value="interface"
        invalid
        onValueChange={() => {}}
      />,
    )
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('keeps its name when the label is hidden', () => {
    render(
      <Select
        label="Output device"
        items={DEVICES}
        value={null}
        hideLabel
        onValueChange={() => {}}
      />,
    )
    expect(screen.getByRole('combobox', { name: 'Output device' })).toBeInTheDocument()
  })

  it('skips a disabled option with the arrows', async () => {
    const onValueChange = vi.fn()
    render(
      <Devices
        items={[
          { value: 'default', label: 'System default' },
          { value: 'cue', label: 'Cue output', disabled: true },
          { value: 'interface', label: 'Scarlett 2i2' },
        ]}
        onValueChange={onValueChange}
      />,
    )
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    await screen.findByRole('listbox')
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('interface')
  })

  it('closes with Escape and gives focus back to the trigger', async () => {
    render(<Devices />)
    const trigger = screen.getByRole('combobox')
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    await screen.findByRole('listbox')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('says so in words when there is nothing to choose from, and stays reachable', async () => {
    render(<Devices items={[]} />)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveTextContent('Nothing to choose from')
    expect(trigger).toHaveAttribute('aria-disabled', 'true')
    await userEvent.tab()
    expect(trigger).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    const list = await screen.findByRole('listbox')
    expect(list).toHaveTextContent('Nothing to choose from')
    const only = screen.getAllByRole('option')
    expect(only).toHaveLength(1)
    expect(only[0]).toHaveAttribute('aria-disabled', 'true')
  })

  it('explains why it cannot be used when disabled', () => {
    render(
      <Select
        label="Output device"
        items={DEVICES}
        value={null}
        disabled
        disabledReason="Stop the set before changing the device."
        onValueChange={() => {}}
      />,
    )
    expect(screen.getByRole('combobox')).toHaveAccessibleDescription(
      'Stop the set before changing the device.',
    )
  })
})
