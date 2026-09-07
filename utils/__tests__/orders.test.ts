import { describe, it, expect, beforeEach } from 'vitest'
import { fetchOrderSummary } from '@/utils/orders'

const filters: { column: string; values: string[] }[] = []

beforeEach(() => {
  filters.length = 0
})

function fakeSupabase({
  order,
  orderError = null,
  reservations = [],
  reservationsError = null,
}: {
  order: unknown
  orderError?: unknown
  reservations?: { seat_id: string; status?: string }[]
  reservationsError?: unknown
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
          eq: () => ({
            in: async (column: string, values: string[]) => {
              filters.push({ column, values })
              return {
                data: reservations.filter((row) => !row.status || values.includes(row.status)),
                error: reservationsError,
              }
            },
          }),
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

  it('no devuelve las butacas de reservas canceladas', async () => {
    const supabase = fakeSupabase({
      order: { status: 'paid_without_seats', amount: 76000 },
      reservations: [
        { seat_id: 'platea-F07-12', status: 'cancelled' },
        { seat_id: 'platea-F07-13', status: 'cancelled' },
      ],
    })

    const result = await fetchOrderSummary(supabase, 'order-1')

    expect(result?.seatIds).toEqual([])
    expect(filters).toEqual([{ column: 'status', values: ['pending', 'confirmed'] }])
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

  it('devuelve null ante un error en la consulta de reservations', async () => {
    const supabase = fakeSupabase({
      order: { status: 'confirmed', amount: 76000 },
      reservationsError: new Error('boom'),
    })
    const result = await fetchOrderSummary(supabase, 'order-1')
    expect(result).toBeNull()
  })
})
