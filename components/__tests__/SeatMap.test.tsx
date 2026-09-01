import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SeatMap } from '@/components/SeatMap'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'
import type { Seat, SeatStatus } from '@/lib/types'

const venue = buildVenue(TEATRO_DEL_GLOBO)
const seats = venue.seats

function renderMap(statusOf: (s: Seat) => SeatStatus = () => 'available') {
  const onToggle = vi.fn()
  render(
    <SeatMap
      venue={venue}
      statusOf={statusOf}
      focusedId={seats[0].id}
      onToggle={onToggle}
      onFocus={vi.fn()}
    />,
  )
  return { onToggle }
}

describe('SeatMap', () => {
  it('pinta las 302 butacas', () => {
    renderMap()
    expect(screen.getAllByRole('gridcell')).toHaveLength(302)
  })

  it('rotula el escenario', () => {
    renderMap()
    expect(screen.getByText('Escenario')).toBeInTheDocument()
  })

  it('calcula el viewBox a partir del contenido, no hardcodeado', () => {
    renderMap()
    const svg = screen.getByRole('group', { name: /platea/i })
    const viewBox = svg.getAttribute('viewBox')!
    const [x, y, w, h] = viewBox.split(' ').map(Number)
    expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true)
    expect(w).toBeGreaterThan(0)
    expect(h).toBeGreaterThan(0)
    expect(y).toBeLessThan(140)
    const maxY = Math.max(...seats.map((s) => s.y))
    expect(y + h).toBeGreaterThan(maxY)
  })

  it('la platea entera es una sola parada de tabulación', () => {
    renderMap()
    const alcanzables = screen
      .getAllByRole('gridcell')
      .filter((b) => b.getAttribute('tabindex') === '0')
    expect(alcanzables).toHaveLength(1)
  })

  it('refleja el estado que devuelve statusOf', () => {
    renderMap((s) => (s.row === 1 ? 'occupied' : 'available'))
    const ocupadas = screen
      .getAllByRole('gridcell')
      .filter((b) => b.getAttribute('aria-disabled') === 'true')
    expect(ocupadas).toHaveLength(14)
  })
})
