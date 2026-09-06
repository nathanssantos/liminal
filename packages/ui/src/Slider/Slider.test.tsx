import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Slider, type SliderValueVisibility } from './Slider.tsx'

function Volume({
  largeStep,
  onValueCommit,
  showValue,
}: {
  largeStep?: number
  onValueCommit?: (value: number) => void
  showValue?: SliderValueVisibility
}) {
  const [value, setValue] = useState(-12)
  return (
    <Slider
      label="Volume"
      value={value}
      onValueChange={setValue}
      min={-60}
      max={0}
      step={1}
      format={(level) => `${level} dB`}
      {...(largeStep === undefined ? {} : { largeStep })}
      {...(onValueCommit === undefined ? {} : { onValueCommit })}
      {...(showValue === undefined ? {} : { showValue })}
    />
  )
}

describe('Slider', () => {
  it('moves by one step with the arrows and to the ends with Home and End', async () => {
    render(<Volume />)
    const thumb = screen.getByRole('slider')
    await userEvent.tab()
    expect(thumb).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(thumb).toHaveAttribute('aria-valuenow', '-11')
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(thumb).toHaveAttribute('aria-valuenow', '-13')
    await userEvent.keyboard('{Home}')
    expect(thumb).toHaveAttribute('aria-valuenow', '-60')
    await userEvent.keyboard('{End}')
    expect(thumb).toHaveAttribute('aria-valuenow', '0')
  })

  it('moves by the large step with PageUp and PageDown', async () => {
    render(<Volume largeStep={25} />)
    const thumb = screen.getByRole('slider')
    await userEvent.tab()
    await userEvent.keyboard('{PageDown}')
    expect(thumb).toHaveAttribute('aria-valuenow', '-37')
    await userEvent.keyboard('{PageUp}')
    expect(thumb).toHaveAttribute('aria-valuenow', '-12')
  })

  it('stops at the ends instead of running past them', async () => {
    render(<Volume largeStep={100} />)
    const thumb = screen.getByRole('slider')
    await userEvent.tab()
    await userEvent.keyboard('{PageDown}')
    expect(thumb).toHaveAttribute('aria-valuenow', '-60')
    await userEvent.keyboard('{PageUp}')
    expect(thumb).toHaveAttribute('aria-valuenow', '0')
  })

  it('commits the large step, so a consumer that persists on release does not lose it', async () => {
    const onValueCommit = vi.fn()
    render(<Volume largeStep={25} onValueCommit={onValueCommit} />)
    await userEvent.tab()
    await userEvent.keyboard('{PageDown}')
    expect(onValueCommit).toHaveBeenCalledWith(-37)
  })

  it('shows the value only while it is changing, when asked to', async () => {
    render(<Volume showValue="while-changing" />)
    expect(screen.queryByText('-12 dB')).not.toBeInTheDocument()
    await userEvent.tab()
    await userEvent.keyboard('{PageUp}')
    expect(screen.getByText('-2 dB')).toBeInTheDocument()
  })

  it('reads the value as words, not as a bare number', () => {
    render(<Volume />)
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '-12 dB')
  })

  it('is named by its visible label', () => {
    render(<Volume />)
    expect(screen.getByRole('slider', { name: 'Volume' })).toBeInTheDocument()
  })

  it('refuses the keyboard when disabled and explains why', async () => {
    const onValueChange = vi.fn()
    render(
      <Slider
        label="Volume"
        value={-12}
        min={-60}
        max={0}
        disabled
        disabledReason="Start the set before changing the level."
        onValueChange={onValueChange}
      />,
    )
    const thumb = screen.getByRole('slider')
    expect(thumb).toHaveAccessibleDescription('Start the set before changing the level.')
    await userEvent.tab()
    expect(thumb).not.toHaveFocus()
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
