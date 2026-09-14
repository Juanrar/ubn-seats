import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchAdminOrder } from '@/utils/admin/orders'

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
