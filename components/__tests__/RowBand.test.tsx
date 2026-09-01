import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RowBand } from '@/components/RowBand'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'
import type { Seat, SeatStatus } from '@/lib/types'

const venue = buildVenue(TEATRO_DEL_GLOBO)
const rowOf = (n: number) => venue.rows.find((r) => r.row === n)!

function renderBand(n = 7, statusOf: (s: Seat) => SeatStatus = () => 'available') {
  const row = rowOf(n)
  const onToggle = vi.fn()
  const view = render(
    <RowBand
      venue={venue}
      row={row}
      statusOf={statusOf}
      focusedId={row.seats[0].id}
      onToggle={onToggle}
      onFocus={vi.fn()}
      onKeyDown={vi.fn()}
    />,
  )
  return { onToggle, row, ...view }
}

describe('RowBand', () => {
  it('pinta la fila activa entera, alas incluidas', () => {
    const { row } = renderBand(7)
    expect(row.seats).toHaveLength(22)
    expect(screen.getAllByRole('gridcell')).toHaveLength(22)
  })

  it('pinta una fila sin bloque central', () => {
    renderBand(16)
    expect(screen.getAllByRole('gridcell')).toHaveLength(6)
  })

  it('rotula la fila con su franja y su precio', () => {
    renderBand(7)
    expect(screen.getByText('Fila 7 · Platea B · 38.000')).toBeInTheDocument()
  })

  it('usa el viewBox propio de la fila', () => {
    const { container, row } = renderBand(7)
    expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe(row.viewBox)
  })

  it('es una grilla con una fila', () => {
    renderBand(7)
    expect(screen.getByRole('grid')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(1)
  })

  it('es una sola parada de tabulación', () => {
    const { container } = renderBand(7)
    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
  })

  it('tocar una butaca la alterna', async () => {
    const { onToggle, row } = renderBand(7)
    await userEvent.click(screen.getAllByRole('gridcell')[0])
    expect(onToggle).toHaveBeenCalledWith(row.seats[0])
  })

  it('tocar una ocupada también avisa al selector', async () => {
    const firstSeatId = rowOf(7).seats[0].id
    const { onToggle, row } = renderBand(7, (seat) =>
      seat.id === firstSeatId ? 'occupied' : 'available',
    )
    await userEvent.click(screen.getAllByRole('gridcell')[0])
    expect(onToggle).toHaveBeenCalledWith(row.seats[0])
  })

  it('marca las ocupadas como deshabilitadas', () => {
    const firstSeatId = rowOf(7).seats[0].id
    renderBand(7, (seat) => (seat.id === firstSeatId ? 'occupied' : 'available'))
    expect(screen.getAllByRole('gridcell')[0]).toHaveAttribute('aria-disabled', 'true')
  })
})
