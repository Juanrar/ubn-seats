import { describe, it, expect } from 'vitest'
import { fetchMyOrders } from '@/utils/tickets/myOrders'

interface Row {
  [key: string]: unknown
}

function clientWith(orders: Row[], reservations: Row[], fail?: 'orders' | 'reservations') {
  const calls: Record<string, Record<string, unknown>> = {}

  function builder(table: string, rows: Row[], shouldFail: boolean) {
    const state: Record<string, unknown> = {}
    calls[table] = state
    const chain = {
      select: () => chain,
      eq: (column: string, value: unknown) => {
        state[`eq:${column}`] = value
        return chain
      },
      in: (column: string, value: unknown) => {
        state[`in:${column}`] = value
        return chain
      },
      order: (column: string, options: unknown) => {
        state[`order:${column}`] = options
        return Promise.resolve(
          shouldFail ? { data: null, error: { message: 'boom' } } : { data: rows, error: null },
        )
      },
      then: (resolve: (value: unknown) => unknown) =>
        resolve(shouldFail ? { data: null, error: { message: 'boom' } } : { data: rows, error: null }),
    }
    return chain
  }

  return {
    calls,
    supabase: {
      from: (table: string) =>
        table === 'orders'
          ? builder('orders', orders, fail === 'orders')
          : builder('reservations', reservations, fail === 'reservations'),
    } as never,
  }
}

describe('fetchMyOrders', () => {
  it('agrupa las butacas confirmadas por orden', async () => {
    const { supabase } = clientWith(
      [{ id: 'o1', amount: 76000, created_at: '2026-09-10T12:00:00Z' }],
      [
        { order_id: 'o1', seat_id: 'platea-F07-12' },
        { order_id: 'o1', seat_id: 'platea-F07-13' },
      ],
    )

    expect(await fetchMyOrders(supabase)).toEqual([
      {
        orderId: 'o1',
        amount: 76000,
        seatIds: ['platea-F07-12', 'platea-F07-13'],
        createdAt: '2026-09-10T12:00:00Z',
      },
    ])
  })

  it('pide solo las órdenes confirmadas, de la más nueva a la más vieja', async () => {
    const { supabase, calls } = clientWith([], [])
    await fetchMyOrders(supabase)

    expect(calls.orders['eq:status']).toBe('confirmed')
    expect(calls.orders['order:created_at']).toEqual({ ascending: false })
  })

  it('descarta una orden sin butacas confirmadas', async () => {
    const { supabase } = clientWith(
      [{ id: 'o1', amount: 76000, created_at: '2026-09-10T12:00:00Z' }],
      [],
    )

    expect(await fetchMyOrders(supabase)).toEqual([])
  })

  it('devuelve vacío si falla la lectura de órdenes', async () => {
    const { supabase } = clientWith([], [], 'orders')
    expect(await fetchMyOrders(supabase)).toEqual([])
  })

  it('devuelve vacío si falla la lectura de reservas', async () => {
    const { supabase } = clientWith(
      [{ id: 'o1', amount: 76000, created_at: '2026-09-10T12:00:00Z' }],
      [],
      'reservations',
    )

    expect(await fetchMyOrders(supabase)).toEqual([])
  })

  it('no consulta reservas si no hay órdenes', async () => {
    const { supabase, calls } = clientWith([], [])
    await fetchMyOrders(supabase)

    expect(calls.reservations).toBeUndefined()
  })
})
