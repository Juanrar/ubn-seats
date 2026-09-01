import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RowRule } from '@/components/RowRule'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'

const venue = buildVenue(TEATRO_DEL_GLOBO)

function renderRule(activeRow = 7) {
  const onChange = vi.fn()
  const view = render(<RowRule venue={venue} activeRow={activeRow} onChange={onChange} />)
  return { onChange, ...view }
}

describe('RowRule', () => {
  it('es un control deslizante rotulado', () => {
    renderRule()
    expect(screen.getByRole('slider', { name: /fila/i })).toBeInTheDocument()
  })

  it('abarca de la primera a la última fila', () => {
    renderRule()
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('min', '1')
    expect(slider).toHaveAttribute('max', '16')
  })

  it('refleja la fila activa', () => {
    renderRule(9)
    expect(screen.getByRole('slider')).toHaveValue('9')
  })

  it('anuncia la fila y la franja en el texto accesible del valor', () => {
    renderRule(7)
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', 'Fila 7, Platea B, 38.000')
  })

  it('escribe el precio de la franja activa sobre la regla', () => {
    renderRule(7)
    expect(screen.getByText('Platea B · 38.000')).toBeInTheDocument()
  })

  it('avisa al mover la regla', () => {
    const { onChange } = renderRule(7)
    fireEvent.change(screen.getByRole('slider'), { target: { value: '12' } })
    expect(onChange).toHaveBeenCalledWith(12)
  })

  it('dibuja una marca por cada fila', () => {
    const { container } = renderRule()
    expect(container.querySelectorAll('[data-row-tick]')).toHaveLength(venue.rows.length)
  })

  it('distingue las marcas donde arranca una franja de tarifa', () => {
    const { container } = renderRule()
    const tierStartRows = venue.tierBands.map((band) => band.fromRow)
    expect(tierStartRows.length).toBeGreaterThan(0)
    for (const row of tierStartRows) {
      expect(container.querySelector(`[data-row-tick="${row}"]`)).toHaveAttribute(
        'data-tier-start',
        'true',
      )
    }
    const midRow = venue.rows.find((r) => !tierStartRows.includes(r.row))!.row
    expect(container.querySelector(`[data-row-tick="${midRow}"]`)).toHaveAttribute(
      'data-tier-start',
      'false',
    )
  })
})
