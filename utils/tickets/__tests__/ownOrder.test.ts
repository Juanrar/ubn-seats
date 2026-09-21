import { describe, it, expect } from 'vitest'
import { fetchOwnPaidOrder } from '@/utils/tickets/ownOrder'

function clientWith(order: unknown, reservations: unknown[], reservationsError = false) {
  const supabase = {
    from: (table: string) => {
      if (table === 'orders') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({ maybeSingle: async () => ({ data: order, error: null }) }),
            }),
          }),
        }
      }
      return {
        select: () => ({
          eq: () => ({
            eq: async () => ({
              data: reservationsError ? null : reservations,
              error: reservationsError ? { message: 'boom' } : null,
            }),
          }),
        }),
      }
    },
  } as never
  return supabase
}

describe('fetchOwnPaidOrder', () => {
  it('devuelve la orden con sus butacas', async () => {
    const supabase = clientWith({ id: 'o1', amount: 76000 }, [
      { seat_id: 'platea-F07-12' },
      { seat_id: 'platea-F07-13' },
    ])

    expect(await fetchOwnPaidOrder(supabase, 'o1')).toEqual({
      orderId: 'o1',
      amount: 76000,
      seatIds: ['platea-F07-12', 'platea-F07-13'],
    })
  })

  it('devuelve null si la orden no aparece', async () => {
    expect(await fetchOwnPaidOrder(clientWith(null, []), 'o1')).toBeNull()
  })

  it('devuelve null si la orden no tiene butacas', async () => {
    expect(await fetchOwnPaidOrder(clientWith({ id: 'o1', amount: 76000 }, []), 'o1')).toBeNull()
  })

  it('devuelve null si falla la lectura de butacas', async () => {
    expect(
      await fetchOwnPaidOrder(clientWith({ id: 'o1', amount: 76000 }, [], true), 'o1'),
    ).toBeNull()
  })
})
