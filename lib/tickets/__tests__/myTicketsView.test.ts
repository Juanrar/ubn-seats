import { describe, it, expect } from 'vitest'
import { buildMyTicketsView } from '@/lib/tickets/myTicketsView'
import { buildVenue } from '@/lib/venue'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'

const VENUE = buildVenue(TEATRO_DEL_GLOBO)

function orderWith(seatIds: string[], amount = 76000) {
  return { orderId: 'o1', amount, seatIds, createdAt: '2026-09-10T12:00:00Z' }
}

describe('buildMyTicketsView', () => {
  it('usa la etiqueta completa de la butaca del recinto', () => {
    const seat = VENUE.seats[0]
    const [view] = buildMyTicketsView([orderWith([seat.id])], VENUE)

    expect(view.seats).toEqual([{ id: seat.id, label: seat.label }])
  })

  it('formatea el total con el formato de precios del proyecto', () => {
    const seat = VENUE.seats[0]
    const [view] = buildMyTicketsView([orderWith([seat.id], 76000)], VENUE)

    expect(view.total).toBe('$ 76.000')
  })

  it('ordena las butacas por fila y número', () => {
    const primera = VENUE.seats.find((s) => s.row === 3 && s.number === 4)!
    const segunda = VENUE.seats.find((s) => s.row === 3 && s.number === 5)!
    const [view] = buildMyTicketsView([orderWith([segunda.id, primera.id])], VENUE)

    expect(view.seats.map((s) => s.id)).toEqual([primera.id, segunda.id])
  })

  it('muestra el id crudo de una butaca que ya no existe en el plano', () => {
    const [view] = buildMyTicketsView([orderWith(['platea-F99-1'])], VENUE)

    expect(view.seats).toEqual([{ id: 'platea-F99-1', label: 'platea-F99-1' }])
  })

  it('preserva el orden de las órdenes que recibe', () => {
    const seat = VENUE.seats[0]
    const views = buildMyTicketsView(
      [
        { orderId: 'nueva', amount: 1000, seatIds: [seat.id], createdAt: '2026-09-10T12:00:00Z' },
        { orderId: 'vieja', amount: 2000, seatIds: [seat.id], createdAt: '2026-09-01T12:00:00Z' },
      ],
      VENUE,
    )

    expect(views.map((v) => v.orderId)).toEqual(['nueva', 'vieja'])
  })

  it('devuelve una lista vacía si no hay órdenes', () => {
    expect(buildMyTicketsView([], VENUE)).toEqual([])
  })
})
