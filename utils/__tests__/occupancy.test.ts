import { describe, it, expect } from 'vitest'
import { fetchOccupiedSeatIds, fetchOwnedSeatIds } from '@/utils/occupancy'

const PERFORMANCE_ID = 'a82bd4e0-937c-4af5-a5c8-259a7f942c68'

function fakeSupabase(data: unknown, error: unknown = null) {
  const calls: [string, unknown][] = []
  const supabase = {
    rpc: async (name: string, args: unknown) => {
      calls.push([name, args])
      return { data, error }
    },
  } as never
  return Object.assign(supabase, { calls })
}

describe('fetchOccupiedSeatIds', () => {
  it('arma un Set con los seat_id devueltos', async () => {
    const supabase = fakeSupabase([{ seat_id: 'platea-F07-12', status: 'confirmed' }, { seat_id: 'platea-F02-01', status: 'pending' }])
    const result = await fetchOccupiedSeatIds(supabase, PERFORMANCE_ID)
    expect(result).toEqual(new Set(['platea-F07-12', 'platea-F02-01']))
  })

  it('pide la ocupación de la función', async () => {
    const supabase = fakeSupabase([])
    await fetchOccupiedSeatIds(supabase, PERFORMANCE_ID)
    expect((supabase as unknown as { calls: unknown[] }).calls).toEqual([
      ['active_reservation_seats', { p_performance_id: PERFORMANCE_ID }],
    ])
  })

  it('devuelve un Set vacío sin filas', async () => {
    const supabase = fakeSupabase([])
    const result = await fetchOccupiedSeatIds(supabase, PERFORMANCE_ID)
    expect(result).toEqual(new Set())
  })

  it('propaga el error de la RPC', async () => {
    const supabase = fakeSupabase(null, new Error('boom'))
    await expect(fetchOccupiedSeatIds(supabase, PERFORMANCE_ID)).rejects.toThrow('boom')
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
  it('trae sólo las reservas confirmadas del usuario para la función', async () => {
    const { supabase, filters } = fakeReservations([{ seat_id: 'platea-F07-12' }])
    const result = await fetchOwnedSeatIds(supabase, 'user-1', PERFORMANCE_ID)
    expect(result).toEqual(new Set(['platea-F07-12']))
    expect(filters).toEqual([
      ['user_id', 'user-1'],
      ['status', 'confirmed'],
      ['performance_id', PERFORMANCE_ID],
    ])
  })

  it('propaga el error de la consulta', async () => {
    const { supabase } = fakeReservations(null, new Error('boom'))
    await expect(fetchOwnedSeatIds(supabase, 'user-1', PERFORMANCE_ID)).rejects.toThrow('boom')
  })
})
