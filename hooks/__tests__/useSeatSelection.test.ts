import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useSeatSelection } from '@/hooks/useSeatSelection'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'
import { MAX_SEATS } from '@/lib/constants'

const seats = buildVenue(TEATRO_DEL_GLOBO).seats
const libres = seats.filter((s) => s.sector === 'platea').slice(0, MAX_SEATS + 3)
const ocupada = seats.find((s) => s.sector === 'platea' && s.row === 3)!

describe('useSeatSelection', () => {
  it('arranca sin nada seleccionado', () => {
    const { result } = renderHook(() => useSeatSelection(new Set()))
    expect(result.current.selectedIds.size).toBe(0)
    expect(result.current.limitReached).toBe(false)
  })

  it('agrega una butaca al tocarla', () => {
    const { result } = renderHook(() => useSeatSelection(new Set()))
    act(() => result.current.toggle(libres[0]))
    expect(result.current.selectedIds.has(libres[0].id)).toBe(true)
  })

  it('la saca al tocarla de nuevo', () => {
    const { result } = renderHook(() => useSeatSelection(new Set()))
    act(() => result.current.toggle(libres[0]))
    act(() => result.current.toggle(libres[0]))
    expect(result.current.selectedIds.size).toBe(0)
  })

  it('ignora las butacas ocupadas', () => {
    const { result } = renderHook(() => useSeatSelection(new Set([ocupada.id])))
    act(() => result.current.toggle(ocupada))
    expect(result.current.selectedIds.size).toBe(0)
  })

  it(`no pasa de ${MAX_SEATS} butacas`, () => {
    const { result } = renderHook(() => useSeatSelection(new Set()))
    for (const seat of libres.slice(0, MAX_SEATS + 2)) {
      act(() => result.current.toggle(seat))
    }
    expect(result.current.selectedIds.size).toBe(MAX_SEATS)
  })

  it('avisa cuando se alcanzó el tope', () => {
    const { result } = renderHook(() => useSeatSelection(new Set()))
    for (const seat of libres.slice(0, MAX_SEATS)) {
      act(() => result.current.toggle(seat))
    }
    expect(result.current.limitReached).toBe(true)
  })

  it('deja de avisar cuando se libera un lugar', () => {
    const { result } = renderHook(() => useSeatSelection(new Set()))
    for (const seat of libres.slice(0, MAX_SEATS)) {
      act(() => result.current.toggle(seat))
    }
    act(() => result.current.toggle(libres[0]))
    expect(result.current.limitReached).toBe(false)
  })

  it('clear vacía la selección', () => {
    const { result } = renderHook(() => useSeatSelection(new Set()))
    act(() => result.current.toggle(libres[0]))
    act(() => result.current.clear())
    expect(result.current.selectedIds.size).toBe(0)
  })
})
