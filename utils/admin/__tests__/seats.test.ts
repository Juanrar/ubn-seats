import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchAdminSeatMap } from '@/utils/admin/seats'

const PERFORMANCE_ID = 'a82bd4e0-937c-4af5-a5c8-259a7f942c68'

function clientWith(data: unknown, error: unknown = null, calls: unknown[][] = []): SupabaseClient {
  return {
    rpc: async (...args: unknown[]) => {
      calls.push(args)
      return { data, error }
    },
  } as unknown as SupabaseClient
}

describe('fetchAdminSeatMap', () => {
  it('arma el mapa con el estado y la orden de cada butaca', async () => {
    const map = await fetchAdminSeatMap(
      clientWith([
        { seat_id: 'platea-F01-01', status: 'confirmed', order_id: 'o1' },
        { seat_id: 'platea-F01-02', status: 'pending', order_id: 'o2' },
        { seat_id: 'platea-F01-03', status: 'blocked', order_id: null },
      ]),
      PERFORMANCE_ID,
    )

    expect(map.size).toBe(3)
    expect(map.get('platea-F01-01')).toEqual({ status: 'confirmed', orderId: 'o1' })
    expect(map.get('platea-F01-02')).toEqual({ status: 'pending', orderId: 'o2' })
    expect(map.get('platea-F01-03')).toEqual({ status: 'blocked', orderId: null })
  })

  it('pide la ocupación de la función', async () => {
    const calls: unknown[][] = []
    await fetchAdminSeatMap(clientWith([], null, calls), PERFORMANCE_ID)
    expect(calls).toEqual([['active_reservation_seats', { p_performance_id: PERFORMANCE_ID }]])
  })

  it('sin filas devuelve un mapa vacío', async () => {
    expect((await fetchAdminSeatMap(clientWith(null), PERFORMANCE_ID)).size).toBe(0)
  })

  it('propaga el error de la base', async () => {
    await expect(
      fetchAdminSeatMap(clientWith(null, { message: 'roto' }), PERFORMANCE_ID),
    ).rejects.toBeTruthy()
  })
})
