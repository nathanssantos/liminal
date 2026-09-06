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
    render(<Devices onValueChange={onValueChange} />)
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    await screen.findByRole('listbox')
    await userEvent.keyboard('{End}{Enter}')
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

  it('says so in words when there is nothing to choose from', async () => {
    render(<Devices items={[]} />)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveTextContent('Nothing to choose from')
    await userEvent.tab()
    expect(trigger).not.toHaveFocus()
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
