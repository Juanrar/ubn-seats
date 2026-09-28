import { describe, it, expect } from 'vitest'
import { fetchAllPerformances, fetchPerformance, fetchPerformancesOnSale } from '@/utils/performances'

const ID = 'a82bd4e0-937c-4af5-a5c8-259a7f942c68'

function fakePerformances(result: { data: unknown; error: unknown }) {
  const calls: [string, ...unknown[]][] = []
  const query = {
    select: (columns: string) => {
      calls.push(['select', columns])
      return query
    },
    gt: (column: string, value: unknown) => {
      calls.push(['gt', column, value])
      return query
    },
    eq: (column: string, value: unknown) => {
      calls.push(['eq', column, value])
      return query
    },
    order: (column: string, options: unknown) => {
      calls.push(['order', column, options])
      return query
    },
    maybeSingle: async () => result,
    then: (resolve: (r: unknown) => void) => resolve(result),
  }
  const tables: string[] = []
  const supabase = {
    from: (table: string) => {
      tables.push(table)
      return query
    },
  } as never
  return { supabase, calls, tables }
}

describe('fetchPerformancesOnSale', () => {
  it('trae las funciones que empiezan después de ahora, ordenadas por fecha', async () => {
    const { supabase, calls, tables } = fakePerformances({
      data: [{ id: ID, starts_at: '2026-12-06T00:00:00+00:00' }],
      error: null,
    })
    const now = new Date('2026-11-01T12:00:00Z')

    const result = await fetchPerformancesOnSale(supabase, now)

    expect(result).toEqual([{ id: ID, startsAt: '2026-12-06T00:00:00+00:00' }])
    expect(tables).toEqual(['performances'])
    expect(calls).toContainEqual(['gt', 'starts_at', now.toISOString()])
    expect(calls).toContainEqual(['order', 'starts_at', { ascending: true }])
  })

  it('propaga el error de la consulta', async () => {
    const { supabase } = fakePerformances({ data: null, error: new Error('boom') })
    await expect(fetchPerformancesOnSale(supabase, new Date())).rejects.toThrow('boom')
  })
})

describe('fetchAllPerformances', () => {
  it('trae también las que ya pasaron', async () => {
    const { supabase, calls } = fakePerformances({
      data: [{ id: ID, starts_at: '2026-12-06T00:00:00+00:00' }],
      error: null,
    })

    const result = await fetchAllPerformances(supabase)

    expect(result).toEqual([{ id: ID, startsAt: '2026-12-06T00:00:00+00:00' }])
    expect(calls.some(([method]) => method === 'gt')).toBe(false)
    expect(calls).toContainEqual(['order', 'starts_at', { ascending: true }])
  })
})

describe('fetchPerformance', () => {
  it('trae una función por id', async () => {
    const { supabase, calls } = fakePerformances({
      data: { id: ID, starts_at: '2026-12-06T00:00:00+00:00' },
      error: null,
    })

    expect(await fetchPerformance(supabase, ID)).toEqual({
      id: ID,
      startsAt: '2026-12-06T00:00:00+00:00',
    })
    expect(calls).toContainEqual(['eq', 'id', ID])
  })

  it('no consulta si el id no tiene forma de UUID', async () => {
    const { supabase, tables } = fakePerformances({ data: null, error: null })

    expect(await fetchPerformance(supabase, 'sabado')).toBeNull()
    expect(tables).toEqual([])
  })

  it('devuelve null si la función no existe o la consulta falla', async () => {
    const vacia = fakePerformances({ data: null, error: null })
    expect(await fetchPerformance(vacia.supabase, ID)).toBeNull()

    const rota = fakePerformances({ data: null, error: new Error('boom') })
    expect(await fetchPerformance(rota.supabase, ID)).toBeNull()
  })
})
