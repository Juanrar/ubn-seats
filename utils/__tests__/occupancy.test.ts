import { describe, it, expect } from 'vitest'
import { fetchOccupiedSeatIds, fetchOwnedSeatIds } from '@/utils/occupancy'

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

function fakeReservations(data: unknown, error: unknown = null) {
  const filters: [string, unknown][] = []
  const query = {
    select: () => query,
    eq: (column: string, value: unknown) => {
      filters.push([column, value])
      return query
    },
    then: (resolve: (r: unknown) => void) => resolve({ data, error }),
  }
  return { supabase: { from: () => query } as never, filters }
}

describe('fetchOwnedSeatIds', () => {
  it('trae sólo las reservas confirmadas del usuario', async () => {
    const { supabase, filters } = fakeReservations([{ seat_id: 'platea-F07-12' }])
    const result = await fetchOwnedSeatIds(supabase, 'user-1')
    expect(result).toEqual(new Set(['platea-F07-12']))
    expect(filters).toEqual([
      ['user_id', 'user-1'],
      ['status', 'confirmed'],
    ])
  })

  it('propaga el error de la consulta', async () => {
    const { supabase } = fakeReservations(null, new Error('boom'))
    await expect(fetchOwnedSeatIds(supabase, 'user-1')).rejects.toThrow('boom')
  })
})
