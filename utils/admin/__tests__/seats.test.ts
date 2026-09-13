import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchAdminSeatMap } from '@/utils/admin/seats'

function clientWith(data: unknown, error: unknown = null): SupabaseClient {
  return { rpc: async () => ({ data, error }) } as unknown as SupabaseClient
}

describe('fetchAdminSeatMap', () => {
  it('arma el mapa con el estado y la orden de cada butaca', async () => {
    const map = await fetchAdminSeatMap(
      clientWith([
        { seat_id: 'platea-F01-01', status: 'confirmed', order_id: 'o1' },
        { seat_id: 'platea-F01-02', status: 'pending', order_id: 'o2' },
        { seat_id: 'platea-F01-03', status: 'blocked', order_id: null },
      ]),
    )

    expect(map.size).toBe(3)
    expect(map.get('platea-F01-01')).toEqual({ status: 'confirmed', orderId: 'o1' })
    expect(map.get('platea-F01-02')).toEqual({ status: 'pending', orderId: 'o2' })
    expect(map.get('platea-F01-03')).toEqual({ status: 'blocked', orderId: null })
  })

  it('sin filas devuelve un mapa vacío', async () => {
    expect((await fetchAdminSeatMap(clientWith(null))).size).toBe(0)
  })

  it('propaga el error de la base', async () => {
    await expect(fetchAdminSeatMap(clientWith(null, { message: 'roto' }))).rejects.toBeTruthy()
  })
})
