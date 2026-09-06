import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { formatElapsed, Readout } from './Readout.tsx'

describe('Readout', () => {
  it('renders an em dash for every value it does not have', () => {
    render(<Readout />)
    const group = screen.getByLabelText('Now playing')
    expect(group.textContent).toContain('—')
    expect(screen.getAllByText('not available')).toHaveLength(4)
  })

  it('joins bar and beat into one position and rounds the tempo', () => {
    render(<Readout tempo={127.6} bar={17} beat={3} musicalKey="F# min" elapsedMs={154000} />)
    const group = screen.getByLabelText('Now playing')
    expect(group).toHaveTextContent('128')
    expect(group).toHaveTextContent('17:3')
    expect(group).toHaveTextContent('F# min')
  })

  it('shows elapsed as m:ss under an hour and h:mm:ss above it', () => {
    expect(formatElapsed(0)).toBe('0:00')
    expect(formatElapsed(9000)).toBe('0:09')
    expect(formatElapsed(599000)).toBe('9:59')
    expect(formatElapsed(600000)).toBe('10:00')
    expect(formatElapsed(3849000)).toBe('1:04:09')
  })

  it('is not a control: it takes no focus and announces nothing on its own', () => {
    const { container } = render(<Readout playing tempo={128} bar={1} beat={1} elapsedMs={0} />)
    expect(container.querySelector('[tabindex]')).toBeNull()
    expect(container.querySelector('[aria-live]')).toBeNull()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('marks only the tempo as live while playing', () => {
    const { container } = render(
      <Readout playing tempo={128} musicalKey="F# min" bar={1} beat={1} elapsedMs={0} />,
    )
    const live = container.querySelectorAll('[data-live]')
    expect(live).toHaveLength(1)
    expect(live[0]).toHaveAttribute('data-field', 'tempo')
  })
})
