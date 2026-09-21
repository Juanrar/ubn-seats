import { describe, it, expect } from 'vitest'
import { fetchOwnPaidOrder } from '@/utils/tickets/ownOrder'

interface Row {
  [key: string]: unknown
}

function clientWith(order: Row | null, reservations: Row[], reservationsError = false) {
  const calls: Record<string, Record<string, unknown>> = {}

  function builder(table: string, resolved: unknown) {
    const state: Record<string, unknown> = {}
    calls[table] = state
    const chain = {
      select: () => chain,
      eq: (column: string, value: unknown) => {
        state[`eq:${column}`] = value
        return chain
      },
      maybeSingle: async () => resolved,
      then: (resolve: (value: unknown) => unknown) => resolve(resolved),
    }
    return chain
  }

  const supabase = {
    from: (table: string) =>
      table === 'orders'
        ? builder('orders', { data: order, error: null })
        : builder('reservations', {
            data: reservationsError ? null : reservations,
            error: reservationsError ? { message: 'boom' } : null,
          }),
  } as never

  return { supabase, calls }
}

describe('fetchOwnPaidOrder', () => {
  it('devuelve la orden con sus butacas', async () => {
    const { supabase } = clientWith({ id: 'o1', amount: 76000 }, [
      { seat_id: 'platea-F07-12' },
      { seat_id: 'platea-F07-13' },
    ])

    expect(await fetchOwnPaidOrder(supabase, 'o1')).toEqual({
      orderId: 'o1',
      amount: 76000,
      seatIds: ['platea-F07-12', 'platea-F07-13'],
    })
  })

  it('filtra por la orden pedida y por estado confirmado, en las dos tablas', async () => {
    const { supabase, calls } = clientWith({ id: 'o1', amount: 76000 }, [
      { seat_id: 'platea-F07-12' },
    ])
    await fetchOwnPaidOrder(supabase, 'o1')

    expect(calls.orders['eq:id']).toBe('o1')
    expect(calls.orders['eq:status']).toBe('confirmed')
    expect(calls.reservations['eq:order_id']).toBe('o1')
    expect(calls.reservations['eq:status']).toBe('confirmed')
  })

  it('devuelve null si la orden no aparece', async () => {
    const { supabase } = clientWith(null, [])
    expect(await fetchOwnPaidOrder(supabase, 'o1')).toBeNull()
  })

  it('devuelve null si la orden no tiene butacas', async () => {
    const { supabase } = clientWith({ id: 'o1', amount: 76000 }, [])
    expect(await fetchOwnPaidOrder(supabase, 'o1')).toBeNull()
  })

  it('devuelve null si falla la lectura de butacas', async () => {
    const { supabase } = clientWith({ id: 'o1', amount: 76000 }, [], true)
    expect(await fetchOwnPaidOrder(supabase, 'o1')).toBeNull()
  })
})
