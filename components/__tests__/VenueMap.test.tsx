import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VenueMap, tierWeightOf } from '@/components/VenueMap'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'

const venue = buildVenue(TEATRO_DEL_GLOBO)

function renderMap(activeRow = 1) {
  const onPickRow = vi.fn()
  const view = render(
    <VenueMap venue={venue} statusOf={() => 'available'} activeRow={activeRow} onPickRow={onPickRow} />,
  )
  return { onPickRow, ...view }
}

describe('VenueMap', () => {
  it('pinta las 302 butacas del plano real', () => {
    const { container } = renderMap()
    expect(container.querySelectorAll('[data-seat-id]')).toHaveLength(302)
  })

  it('rotula el escenario', () => {
    renderMap()
    expect(screen.getByText('Escenario')).toBeInTheDocument()
  })

  it('escribe el número de fila en los dos extremos de cada arco', () => {
    renderMap()
    expect(screen.getAllByText('7')).toHaveLength(2)
    expect(screen.getAllByText('16')).toHaveLength(2)
  })

  it('rotula cada franja de tarifa con su precio', () => {
    const { container } = renderMap()
    expect(container.querySelector('[data-tier-label="Platea A"]')?.textContent).toBe(
      'Platea A · 45.000',
    )
    expect(container.querySelector('[data-tier-label="Platea B"]')?.textContent).toBe(
      'Platea B · 38.000',
    )
    expect(container.querySelector('[data-tier-label="Platea C"]')?.textContent).toBe(
      'Platea C · 30.000',
    )
  })

  it('toma el viewBox del recinto y no lo hardcodea', () => {
    const { container } = renderMap()
    expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe(venue.viewBox)
  })

  it('marca la fila activa', () => {
    const { container } = renderMap(7)
    const active = container.querySelectorAll('[data-row="7"][data-active="true"]')
    expect(active.length).toBeGreaterThan(0)
    expect(container.querySelectorAll('[data-row="8"][data-active="true"]')).toHaveLength(0)
  })

  it('tocar una fila la lleva al foco', async () => {
    const { onPickRow, container } = renderMap()
    const seat = container.querySelector('[data-seat-id="platea-F09-12"]')!
    await userEvent.click(seat)
    expect(onPickRow).toHaveBeenCalledWith(9)
  })

  it('el plano no es una parada de tabulación ni expone botones', () => {
    const { container } = renderMap()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(0)
  })

  it('da más trazo a la franja cara que a la barata', () => {
    expect(tierWeightOf(venue, 45000)).toBeGreaterThan(tierWeightOf(venue, 24000))
    expect(tierWeightOf(venue, 45000)).toBe(1.6)
    expect(tierWeightOf(venue, 24000)).toBe(0.7)
  })

  it('ancla las tres etiquetas de franja a la misma x, fuera del bloque de butacas', () => {
    const { container } = renderMap()
    for (const band of venue.tierBands) {
      const node = container.querySelector(`[data-tier-label="${band.label}"]`)!
      expect(node.getAttribute('data-x')).toBe(String(venue.tierLabelX))
    }
  })

  it('los rótulos de fila 15 y 16 no comparten la misma altura', () => {
    renderMap()
    const y15 = screen.getAllByText('15')[0].getAttribute('data-y')
    const y16 = screen.getAllByText('16')[0].getAttribute('data-y')
    expect(y15).not.toBe(y16)
  })

  it('los rótulos del plano viven fuera del SVG, en texto HTML con piso de tamaño', () => {
    const { container } = renderMap()
    const svgText = container.querySelector('svg')!.querySelectorAll('text')
    expect(svgText).toHaveLength(0)
    const stageLabel = screen.getByText('Escenario')
    expect(stageLabel.tagName).toBe('SPAN')
    expect(stageLabel.className).toContain('text-ui-sm')
  })

  it('en la vista chica sólo se ven los números de fila en los arranques de franja', () => {
    const { container } = renderMap(1)
    const boundaryRows = new Set(venue.tierBands.map((band) => band.fromRow))
    for (const row of venue.rows) {
      const nodes = container.querySelectorAll(`[data-row-number="${row.row}"]`)
      expect(nodes.length).toBeGreaterThan(0)
      for (const node of Array.from(nodes)) {
        expect(node.className.includes('hidden')).toBe(!boundaryRows.has(row.row))
      }
    }
  })

  it('en el margen del plano, las tres franjas quedan ocultas en la vista chica (van arriba como texto aparte)', () => {
    const { container } = renderMap(7)
    for (const band of venue.tierBands) {
      const node = container.querySelector(`[data-tier-label="${band.label}"]`)!
      expect(node.className.includes('hidden')).toBe(true)
    }
  })

  it('en la vista chica, la franja activa aparece como texto normal arriba del plano, sin cortarse en el borde', () => {
    const { container } = renderMap(7)
    const caption = container.querySelector('[data-mobile-tier-label="Platea B"]')!
    expect(caption.textContent).toBe('Platea B · 38.000')
    expect(caption.className.includes('md:hidden')).toBe(true)
    expect(caption.className.includes('absolute')).toBe(false)
  })
})
