import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useRowFocus } from '@/hooks/useRowFocus'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'

const venue = buildVenue(TEATRO_DEL_GLOBO)

describe('useRowFocus', () => {
  it('arranca en la primera fila', () => {
    const { result } = renderHook(() => useRowFocus(venue))
    expect(result.current.activeRow).toBe(1)
    expect(result.current.activeIndex).toBe(0)
    expect(result.current.row.row).toBe(1)
  })

  it('expone la cantidad de filas', () => {
    const { result } = renderHook(() => useRowFocus(venue))
    expect(result.current.rowCount).toBe(16)
  })

  it('cambia de fila', () => {
    const { result } = renderHook(() => useRowFocus(venue))
    act(() => result.current.setActiveRow(7))
    expect(result.current.activeRow).toBe(7)
    expect(result.current.row.tier.label).toBe('Platea B')
  })

  it('no se pasa de la primera ni de la última fila', () => {
    const { result } = renderHook(() => useRowFocus(venue))
    act(() => result.current.setActiveRow(0))
    expect(result.current.activeRow).toBe(1)
    act(() => result.current.setActiveRow(99))
    expect(result.current.activeRow).toBe(16)
  })

  it('avanza y retrocede de a pasos', () => {
    const { result } = renderHook(() => useRowFocus(venue))
    act(() => result.current.setActiveRow(7))
    act(() => result.current.step(1))
    expect(result.current.activeRow).toBe(8)
    act(() => result.current.step(-3))
    expect(result.current.activeRow).toBe(5)
  })

  it('lleva el foco a la fila de una butaca', () => {
    const { result } = renderHook(() => useRowFocus(venue))
    act(() => result.current.focusSeatRow('platea-F09-12'))
    expect(result.current.activeRow).toBe(9)
  })

  it('ignora un id de butaca que no existe', () => {
    const { result } = renderHook(() => useRowFocus(venue))
    act(() => result.current.setActiveRow(7))
    act(() => result.current.focusSeatRow('no-existe'))
    expect(result.current.activeRow).toBe(7)
  })
})
