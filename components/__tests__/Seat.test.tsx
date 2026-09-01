import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SeatButton, SeatShape } from '@/components/Seat'
import type { SeatStatus } from '@/lib/types'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'

const seats = buildVenue(TEATRO_DEL_GLOBO).seats
const butaca = seats.find((s) => s.sector === 'platea' && s.row === 7 && s.number === 12)!

function renderSeat(props: Partial<Parameters<typeof SeatButton>[0]> = {}) {
  const onToggle = vi.fn()
  const onFocus = vi.fn()
  render(
    <svg>
      <SeatButton
        seat={butaca}
        geometry={TEATRO_DEL_GLOBO.geometry}
        status="available"
        focused
        tierWeight={1}
        onToggle={onToggle}
        onFocus={onFocus}
        {...props}
      />
    </svg>,
  )
  return { onToggle, onFocus }
}

describe('SeatButton', () => {
  it('expone la plaza como celda de grilla con su descripción y precio', () => {
    renderSeat()
    const boton = screen.getByRole('gridcell')
    expect(boton).toHaveAccessibleName(/Fila 7, butaca 12, Platea B/)
    expect(boton).toHaveAccessibleName(/38\.000/)
    expect(boton).toHaveAccessibleName(/disponible/i)
  })

  it('avisa cuando la butaca está seleccionada', () => {
    renderSeat({ status: 'selected' })
    expect(screen.getByRole('gridcell')).toHaveAccessibleName(/seleccionada/i)
  })

  it('avisa cuando la butaca está ocupada y la deshabilita', () => {
    renderSeat({ status: 'occupied' })
    const boton = screen.getByRole('gridcell')
    expect(boton).toHaveAccessibleName(/ocupada/i)
    expect(boton).toHaveAttribute('aria-disabled', 'true')
  })

  it('llama a onToggle al hacer click en una butaca disponible', async () => {
    const { onToggle } = renderSeat()
    await userEvent.click(screen.getByRole('gridcell'))
    expect(onToggle).toHaveBeenCalledWith(butaca)
  })

  it('llama a onToggle igual si la butaca está ocupada, para poder avisar el rechazo', async () => {
    const { onToggle } = renderSeat({ status: 'occupied' })
    await userEvent.click(screen.getByRole('gridcell'))
    expect(onToggle).toHaveBeenCalledWith(butaca)
  })

  it('solo la butaca enfocada es alcanzable con Tab (roving tabindex)', () => {
    renderSeat({ focused: false })
    expect(screen.getByRole('gridcell')).toHaveAttribute('tabindex', '-1')
  })

  it('la butaca enfocada tiene tabindex 0', () => {
    renderSeat({ focused: true })
    expect(screen.getByRole('gridcell')).toHaveAttribute('tabindex', '0')
  })

})

describe('SeatShape — estado por tinta, nunca por color', () => {
  const renderShape = (status: SeatStatus, tierWeight = 1) =>
    render(
      <svg>
        <SeatShape status={status} width={20} height={17} tierWeight={tierWeight} />
      </svg>,
    )

  it('tacha la butaca ocupada', () => {
    const { container } = renderShape('occupied')
    expect(container.querySelector('[data-testid="seat-slash"]')).toBeInTheDocument()
  })

  it('no tacha una butaca disponible ni una seleccionada', () => {
    const { container: a } = renderShape('available')
    expect(a.querySelector('[data-testid="seat-slash"]')).not.toBeInTheDocument()
    const { container: b } = renderShape('selected')
    expect(b.querySelector('[data-testid="seat-slash"]')).not.toBeInTheDocument()
  })

  it('dibuja la franja cara con más trazo que la barata', () => {
    const { container: dear } = renderShape('available', 1.6)
    const { container: cheap } = renderShape('available', 0.8)
    expect(dear.querySelector('rect')!.getAttribute('stroke-width')).toBe('1.6')
    expect(cheap.querySelector('rect')!.getAttribute('stroke-width')).toBe('0.8')
  })

  it('la butaca ocupada se lee con tinta legible, no con la regla tenue', () => {
    const { container } = renderShape('occupied')
    expect(container.querySelector('rect')).toHaveClass('stroke-ink-mute')
    expect(container.querySelector('[data-testid="seat-slash"]')).toHaveClass('stroke-ink-mute')
  })
})
