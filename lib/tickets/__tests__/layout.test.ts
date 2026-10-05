import { describe, it, expect } from 'vitest'
import { layoutTicketPage, type FontMetrics } from '@/lib/tickets/layout'

const METRICS: FontMetrics = {
  capHeightRatio: 0.5,
  widthOfTextAtSize: (text, size) => text.length * size * 0.5,
}

describe('layoutTicketPage', () => {
  it('arma una página del tamaño de la imagen impresa a 300 dpi', () => {
    const page = layoutTicketPage({ row: 7, number: 12 }, METRICS)

    expect(page.width).toBeCloseTo(518.4)
    expect(page.height).toBeCloseTo(196.8)
  })

  it('escribe la fila y después el asiento', () => {
    const page = layoutTicketPage({ row: 7, number: 12 }, METRICS)

    expect(page.values.map((value) => value.text)).toEqual(['7', '12'])
  })

  it('da a los valores 25 px de mayúscula y 0,12 em de espaciado', () => {
    const [row] = layoutTicketPage({ row: 7, number: 12 }, METRICS).values

    expect(row.size).toBeCloseTo(12)
    expect(row.characterSpacing).toBeCloseTo(1.44)
  })

  it('apoya cada valor 20 px debajo de su línea', () => {
    const [row, seat] = layoutTicketPage({ row: 7, number: 12 }, METRICS).values

    expect(row.y).toBeCloseTo(89.28)
    expect(seat.y).toBeCloseTo(42.96)
  })

  it('centra en la columna los valores de una y de dos cifras', () => {
    const [row, seat] = layoutTicketPage({ row: 7, number: 12 }, METRICS).values

    expect(row.x).toBeCloseTo(480.12)
    expect(seat.x).toBeCloseTo(476.4)
  })

  it('centra igual una butaca de ala con fila y asiento de dos cifras', () => {
    const [row, seat] = layoutTicketPage({ row: 16, number: 19 }, METRICS).values

    expect(row.x).toBeCloseTo(476.4)
    expect(seat.x).toBeCloseTo(476.4)
  })
})
