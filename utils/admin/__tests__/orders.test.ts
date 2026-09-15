import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchAdminOrder, fetchAdminOrders } from '@/utils/admin/orders'

const ORDER = {
  id: 'o1',
  user_id: 'u1',
  status: 'confirmed',
  amount: 114000,
  created_at: '2026-09-10T18:00:00Z',
  mp_payment_id: '123456',
  ticket_sent_at: '2026-09-10T18:01:00Z',
}

function clientWith({
  order = ORDER as Record<string, unknown> | null,
  seats = [{ seat_id: 'platea-F07-12' }, { seat_id: 'platea-F07-11' }],
  seatsError = null as { message: string } | null,
  email = 'ana@mail.com' as string | null,
}): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === 'orders') {
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: order, error: null }) }) }),
        }
      }
      return {
        select: () => ({ eq: () => ({ in: async () => ({ data: seats, error: seatsError }) }) }),
      }
    },
    auth: {
      admin: {
        getUserById: async () => ({ data: { user: email ? { email } : null }, error: null }),
      },
    },
  } as unknown as SupabaseClient
}

describe('fetchAdminOrder', () => {
  it('devuelve la orden con sus butacas ordenadas y el mail del comprador', async () => {
    const order = await fetchAdminOrder(clientWith({}), 'o1')

    expect(order).toEqual({
      id: 'o1',
      status: 'confirmed',
      amount: 114000,
      createdAt: '2026-09-10T18:00:00Z',
      mpPaymentId: '123456',
      ticketSentAt: '2026-09-10T18:01:00Z',
      email: 'ana@mail.com',
      seatIds: ['platea-F07-11', 'platea-F07-12'],
    })
  })

  it('una orden que no existe es null', async () => {
    expect(await fetchAdminOrder(clientWith({ order: null }), 'o1')).toBeNull()
  })

  it('sin mail del comprador la orden igual se devuelve', async () => {
    const order = await fetchAdminOrder(clientWith({ email: null }), 'o1')
    expect(order?.email).toBeNull()
    expect(order?.seatIds).toHaveLength(2)
  })

  it('si falla la consulta de reservas devuelve null en vez de una orden sin butacas', async () => {
    expect(await fetchAdminOrder(clientWith({ seatsError: { message: 'roto' } }), 'o1')).toBeNull()
  })

  it('ordena las butacas por fila y número, no alfabéticamente', async () => {
    const order = await fetchAdminOrder(
      clientWith({
        seats: [
          { seat_id: 'platea-F07-10' },
          { seat_id: 'platea-F07-2' },
          { seat_id: 'platea-F03-11' },
        ],
      }),
      'o1',
    )
    expect(order?.seatIds).toEqual(['platea-F03-11', 'platea-F07-2', 'platea-F07-10'])
  })
})

function listClient({
  orders = [
    { ...ORDER, id: 'o2', user_id: 'u2', created_at: '2026-09-11T18:00:00Z' },
    ORDER,
  ] as Record<string, unknown>[],
  ordersError = null as { message: string } | null,
  seats = [
    { order_id: 'o1', seat_id: 'platea-F07-12' },
    { order_id: 'o1', seat_id: 'platea-F07-11' },
    { order_id: 'o2', seat_id: 'platea-F03-08' },
  ],
  seatsError = null as { message: string } | null,
  users = [
    { id: 'u1', email: 'ana@mail.com' },
    { id: 'u2', email: 'lucia@mail.com' },
  ] as { id: string; email: string }[] | null,
}): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === 'orders') {
        return {
          select: () => ({
            order: () => ({ limit: async () => ({ data: orders, error: ordersError }) }),
          }),
        }
      }
      return {
        select: () => ({ in: () => ({ in: async () => ({ data: seats, error: seatsError }) }) }),
      }
    },
    auth: {
      admin: {
        listUsers: async () =>
          users
            ? { data: { users }, error: null }
            : { data: { users: [] }, error: { message: 'boom' } },
      },
    },
  } as unknown as SupabaseClient
}

describe('fetchAdminOrders', () => {
  it('devuelve las órdenes con su mail y sus butacas ordenadas', async () => {
    const orders = await fetchAdminOrders(listClient({}))

    expect(orders.map((o) => o.id)).toEqual(['o2', 'o1'])
    expect(orders[0]).toMatchObject({ email: 'lucia@mail.com', seatIds: ['platea-F03-08'] })
    expect(orders[1]).toMatchObject({
      email: 'ana@mail.com',
      seatIds: ['platea-F07-11', 'platea-F07-12'],
    })
  })

  it('si no puede leer los usuarios deja las órdenes sin mail', async () => {
    const orders = await fetchAdminOrders(listClient({ users: null }))
    expect(orders.map((o) => o.email)).toEqual([null, null])
  })

  it('sin órdenes devuelve una lista vacía', async () => {
    expect(await fetchAdminOrders(listClient({ orders: [] }))).toEqual([])
  })

  it('lanza si falla la lectura de órdenes', async () => {
    await expect(
      fetchAdminOrders(listClient({ ordersError: { message: 'boom' } })),
    ).rejects.toBeTruthy()
  })

  it('lanza si falla la lectura de butacas', async () => {
    await expect(
      fetchAdminOrders(listClient({ seatsError: { message: 'boom' } })),
    ).rejects.toBeTruthy()
  })
})
