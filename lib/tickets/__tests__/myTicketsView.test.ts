import { describe, it, expect } from 'vitest'
import { buildMyTicketsView, countTickets } from '@/lib/tickets/myTicketsView'
import { buildVenue } from '@/lib/venue'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'

const VENUE = buildVenue(TEATRO_DEL_GLOBO)

const SABADO = { id: 'perf-sab', startsAt: '2026-12-06T00:00:00+00:00' }
const LUNES = { id: 'perf-lun', startsAt: '2026-12-08T00:00:00+00:00' }

function orderWith(seatIds: string[], amount = 76000) {
  return { orderId: 'o1', amount, seatIds, createdAt: '2026-09-10T12:00:00Z', performance: SABADO }
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

  it('muestra la fecha de la función', () => {
    const [view] = buildMyTicketsView([orderWith([VENUE.seats[0].id])], VENUE)

    expect(view.date).toBe('Sábado 5 de diciembre · 21 h')
  })

  it('ordena por función, la más próxima primero, y a igual función por compra más reciente', () => {
    const seat = VENUE.seats[0]
    const order = (orderId: string, createdAt: string, performance: typeof SABADO) => ({
      orderId,
      amount: 1000,
      seatIds: [seat.id],
      createdAt,
      performance,
    })
    const views = buildMyTicketsView(
      [
        order('lunes', '2026-09-20T12:00:00Z', LUNES),
        order('sabado-vieja', '2026-09-01T12:00:00Z', SABADO),
        order('sabado-nueva', '2026-09-10T12:00:00Z', SABADO),
      ],
      VENUE,
    )

    expect(views.map((v) => v.orderId)).toEqual(['sabado-nueva', 'sabado-vieja', 'lunes'])
  })

  it('devuelve una lista vacía si no hay órdenes', () => {
    expect(buildMyTicketsView([], VENUE)).toEqual([])
  })
})

describe('countTickets', () => {
  it('cuenta una entrada por butaca de todas las órdenes', () => {
    const [a, b, c] = VENUE.seats
    const orders = [orderWith([a.id, b.id]), { ...orderWith([c.id]), orderId: 'o2' }]

    expect(countTickets(orders)).toBe(3)
  })

  it('sin órdenes no hay entradas', () => {
    expect(countTickets([])).toBe(0)
  })
})
