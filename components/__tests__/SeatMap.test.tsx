import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SeatMap } from '@/components/SeatMap'
import { buildSeats } from '@/lib/seats'
import type { Seat, SeatStatus } from '@/lib/types'

const seats = buildSeats()

function renderMap(statusOf: (s: Seat) => SeatStatus = () => 'available') {
  const onToggle = vi.fn()
  render(
    <SeatMap
      seats={seats}
      statusOf={statusOf}
      focusedId={seats[0].id}
      onToggle={onToggle}
      onFocus={vi.fn()}
    />,
  )
  return { onToggle }
}

describe('SeatMap', () => {
  it('pinta las 308 plazas', () => {
    renderMap()
    expect(screen.getAllByRole('button')).toHaveLength(308)
  })

  it('rotula el escenario', () => {
    renderMap()
    expect(screen.getByText('ESCENARIO')).toBeInTheDocument()
  })

  it('calcula el viewBox a partir del contenido, no hardcodeado', () => {
    renderMap()
    const svg = screen.getByRole('group', { name: /platea/i })
    const viewBox = svg.getAttribute('viewBox')!
    const [x, y, w, h] = viewBox.split(' ').map(Number)
    expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true)
    expect(w).toBeGreaterThan(0)
    expect(h).toBeGreaterThan(0)
    // El escenario está arriba de todo, así que el borde superior lo incluye.
    expect(y).toBeLessThan(140)
    // Y la fila 16 es lo más bajo.
    const maxY = Math.max(...seats.map((s) => s.y))
    expect(y + h).toBeGreaterThan(maxY)
  })

  it('la platea entera es una sola parada de tabulación', () => {
    renderMap()
    const alcanzables = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('tabindex') === '0')
    expect(alcanzables).toHaveLength(1)
  })

  it('refleja el estado que devuelve statusOf', () => {
    renderMap((s) => (s.row === 1 ? 'occupied' : 'available'))
    const ocupadas = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-disabled') === 'true')
    // Fila 1: 14 butacas centrales + 2 espacios accesibles.
    expect(ocupadas).toHaveLength(16)
  })
})
