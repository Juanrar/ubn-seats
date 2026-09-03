import { describe, it, expect } from 'vitest'
import { fetchOccupiedSeatIds } from '@/utils/occupancy'

function fakeSupabase(data: unknown, error: unknown = null) {
  return { rpc: async () => ({ data, error }) } as never
}

describe('fetchOccupiedSeatIds', () => {
  it('arma un Set con los seat_id devueltos', async () => {
    const supabase = fakeSupabase([{ seat_id: 'platea-F07-12', status: 'confirmed' }, { seat_id: 'platea-F02-01', status: 'pending' }])
    const result = await fetchOccupiedSeatIds(supabase)
    expect(result).toEqual(new Set(['platea-F07-12', 'platea-F02-01']))
  })

  it('devuelve un Set vacío sin filas', async () => {
    const supabase = fakeSupabase([])
    const result = await fetchOccupiedSeatIds(supabase)
    expect(result).toEqual(new Set())
  })

  it('propaga el error de la RPC', async () => {
    const supabase = fakeSupabase(null, new Error('boom'))
    await expect(fetchOccupiedSeatIds(supabase)).rejects.toThrow('boom')
  })
})
