import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAdminMap } from '@/hooks/useAdminMap'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'
import type { SeatOccupancy } from '@/lib/admin/seatState'

const venue = buildVenue(TEATRO_DEL_GLOBO)

function seatAt(index: number) {
  return venue.seats[index]
}

function setup(entries: [string, SeatOccupancy][] = []) {
  return renderHook(() => useAdminMap(venue, new Map(entries)))
}

describe('useAdminMap', () => {
  it('arranca sin selección y sin orden abierta', () => {
    const { result } = setup()
    expect(result.current.selectedCount).toBe(0)
    expect(result.current.openOrderId).toBeNull()
    expect(result.current.action).toBe('none')
  })

  it('activar una butaca libre la selecciona, y de nuevo la saca', () => {
    const { result } = setup()
    const seat = seatAt(0)

    act(() => result.current.activate(seat))
    expect(result.current.selectedCount).toBe(1)
    expect(result.current.action).toBe('block')
    expect(result.current.statusOf(seat)).toBe('selected')

    act(() => result.current.activate(seat))
    expect(result.current.selectedCount).toBe(0)
  })

  it('no tiene tope de selección', () => {
    const { result } = setup()
    const many = venue.seats.slice(0, venue.maxSeats + 12)

    act(() => {
      for (const seat of many) result.current.activate(seat)
    })

    expect(result.current.selectedCount).toBe(many.length)
    expect(many.length).toBeGreaterThan(venue.maxSeats)
  })

  it('activar una vendida abre su orden y limpia la selección', () => {
    const sold = seatAt(5)
    const { result } = setup([[sold.id, { status: 'confirmed', orderId: 'o1' }]])

    act(() => result.current.activate(seatAt(0)))
    expect(result.current.selectedCount).toBe(1)

    act(() => result.current.activate(sold))
    expect(result.current.openOrderId).toBe('o1')
    expect(result.current.selectedCount).toBe(0)
  })

  it('activar una libre cierra la orden abierta', () => {
    const sold = seatAt(5)
    const { result } = setup([[sold.id, { status: 'confirmed', orderId: 'o1' }]])

    act(() => result.current.activate(sold))
    expect(result.current.openOrderId).toBe('o1')

    act(() => result.current.activate(seatAt(0)))
    expect(result.current.openOrderId).toBeNull()
    expect(result.current.selectedCount).toBe(1)
  })

  it('una selección de bloqueadas propone liberarlas', () => {
    const seat = seatAt(3)
    const { result } = setup([[seat.id, { status: 'blocked', orderId: null }]])

    act(() => result.current.activate(seat))
    expect(result.current.action).toBe('unblock')
  })

  it('mezclar libres con bloqueadas no es una acción válida', () => {
    const blocked = seatAt(3)
    const { result } = setup([[blocked.id, { status: 'blocked', orderId: null }]])

    act(() => {
      result.current.activate(blocked)
      result.current.activate(seatAt(0))
    })

    expect(result.current.action).toBe('mixed')
  })

  it('clear vacía la selección', () => {
    const { result } = setup()
    act(() => result.current.activate(seatAt(0)))
    act(() => result.current.clear())
    expect(result.current.selectedCount).toBe(0)
  })

  it('closeOrder cierra la orden abierta', () => {
    const sold = seatAt(5)
    const { result } = setup([[sold.id, { status: 'confirmed', orderId: 'o1' }]])

    act(() => result.current.activate(sold))
    act(() => result.current.closeOrder())
    expect(result.current.openOrderId).toBeNull()
  })

  it('las flechas mueven el foco lógico', () => {
    const { result } = setup()
    const first = result.current.focusedId

    act(() =>
      result.current.onKeyDown({
        key: 'ArrowRight',
        preventDefault: () => {},
      } as React.KeyboardEvent<SVGSVGElement>),
    )

    expect(result.current.focusedId).not.toBe(first)
  })

  it('Enter activa la butaca enfocada', () => {
    const { result } = setup()

    act(() =>
      result.current.onKeyDown({
        key: 'Enter',
        preventDefault: () => {},
      } as React.KeyboardEvent<SVGSVGElement>),
    )

    expect(result.current.selectedCount).toBe(1)
  })
})
