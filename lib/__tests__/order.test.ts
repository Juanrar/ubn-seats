import { describe, it, expect } from 'vitest'
import { buildOrderItems } from '@/lib/order'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'

const catalogo = buildVenue(TEATRO_DEL_GLOBO).seats
const seat = (id: string) => catalogo.find((s) => s.id === id)!
const SABADO = { id: 'a82bd4e0-937c-4af5-a5c8-259a7f942c68', startsAt: '2026-12-06T00:00:00+00:00' }

describe('buildOrderItems', () => {
  it('arma un ítem por butaca con el precio del catálogo y la función en el título', () => {
    const seats = [seat('platea-F07-12'), seat('platea-F02-1')]
    const { items } = buildOrderItems(seats, SABADO)

    expect(items).toEqual([
      {
        id: 'platea-F07-12',
        title: `${seats[0].label} · Sábado 5 de diciembre · 21 h`,
        quantity: 1,
        unit_price: seats[0].price,
        currency_id: 'ARS',
      },
      {
        id: 'platea-F02-1',
        title: `${seats[1].label} · Sábado 5 de diciembre · 21 h`,
        quantity: 1,
        unit_price: seats[1].price,
        currency_id: 'ARS',
      },
    ])
  })

  it('suma los precios en amount', () => {
    const seats = [seat('platea-F07-12'), seat('platea-F02-1')]
    const { amount } = buildOrderItems(seats, SABADO)
    expect(amount).toBe(seats[0].price + seats[1].price)
  })

  it('sin butacas devuelve items vacío y amount 0', () => {
    expect(buildOrderItems([], SABADO)).toEqual({ items: [], amount: 0 })
  })
})
