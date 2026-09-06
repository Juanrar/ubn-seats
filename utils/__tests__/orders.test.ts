import { describe, it, expect } from 'vitest'
import { fetchOrderSummary } from '@/utils/orders'

function fakeSupabase({
  order,
  orderError = null,
  reservations = [],
}: {
  order: unknown
  orderError?: unknown
  reservations?: { seat_id: string }[]
}) {
  return {
    from(table: string) {
      if (table === 'orders') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: order, error: orderError }),
            }),
          }),
        }
      }
      return {
        select: () => ({
          eq: async () => ({ data: reservations, error: null }),
        }),
      }
    },
  } as never
}

describe('fetchOrderSummary', () => {
  it('arma el resumen con status, amount y los seat_id de la orden', async () => {
    const supabase = fakeSupabase({
      order: { status: 'confirmed', amount: 76000 },
      reservations: [{ seat_id: 'platea-F07-12' }, { seat_id: 'platea-F07-13' }],
    })

    const result = await fetchOrderSummary(supabase, 'order-1')

    expect(result).toEqual({ status: 'confirmed', amount: 76000, seatIds: ['platea-F07-12', 'platea-F07-13'] })
  })

  it('devuelve null si la orden no existe o no es del usuario', async () => {
    const supabase = fakeSupabase({ order: null })
    const result = await fetchOrderSummary(supabase, 'order-ajeno')
    expect(result).toBeNull()
  })

  it('devuelve null ante un error de la consulta', async () => {
    const supabase = fakeSupabase({ order: null, orderError: new Error('boom') })
    const result = await fetchOrderSummary(supabase, 'order-1')
    expect(result).toBeNull()
  })
})
