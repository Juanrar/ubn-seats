import { describe, it, expect } from 'vitest'
import {
  adminSeatStatus,
  isSelectable,
  orderIdAt,
  selectionAction,
  type SeatOccupancy,
} from '@/lib/admin/seatState'

function occupancy(entries: [string, SeatOccupancy][]): Map<string, SeatOccupancy> {
  return new Map(entries)
}

describe('adminSeatStatus', () => {
  it('una butaca sin fila activa está libre', () => {
    expect(adminSeatStatus('platea-F01-01', occupancy([]), new Set())).toBe('free')
  })

  it('una butaca libre que está en la selección es seleccionada', () => {
    expect(adminSeatStatus('platea-F01-01', occupancy([]), new Set(['platea-F01-01']))).toBe(
      'selected',
    )
  })

  it('una fila confirmed es vendida', () => {
    const map = occupancy([['platea-F01-01', { status: 'confirmed', orderId: 'o1' }]])
    expect(adminSeatStatus('platea-F01-01', map, new Set())).toBe('sold')
  })

  it('una fila pending es reservada', () => {
    const map = occupancy([['platea-F01-01', { status: 'pending', orderId: 'o1' }]])
    expect(adminSeatStatus('platea-F01-01', map, new Set())).toBe('pending')
  })

  it('una fila blocked es bloqueada', () => {
    const map = occupancy([['platea-F01-01', { status: 'blocked', orderId: null }]])
    expect(adminSeatStatus('platea-F01-01', map, new Set())).toBe('blocked')
  })

  it('una bloqueada que está en la selección es seleccionada', () => {
    const map = occupancy([['platea-F01-01', { status: 'blocked', orderId: null }]])
    expect(adminSeatStatus('platea-F01-01', map, new Set(['platea-F01-01']))).toBe('selected')
  })

  it('una vendida no se vuelve seleccionada aunque esté en la selección', () => {
    const map = occupancy([['platea-F01-01', { status: 'confirmed', orderId: 'o1' }]])
    expect(adminSeatStatus('platea-F01-01', map, new Set(['platea-F01-01']))).toBe('sold')
  })

  it('una reservada no se vuelve seleccionada aunque esté en la selección', () => {
    const map = occupancy([['platea-F01-01', { status: 'pending', orderId: 'o1' }]])
    expect(adminSeatStatus('platea-F01-01', map, new Set(['platea-F01-01']))).toBe('pending')
  })
})

describe('isSelectable', () => {
  it('las libres y las bloqueadas se pueden seleccionar', () => {
    const map = occupancy([['platea-F01-02', { status: 'blocked', orderId: null }]])
    expect(isSelectable('platea-F01-01', map)).toBe(true)
    expect(isSelectable('platea-F01-02', map)).toBe(true)
  })

  it('las vendidas y las reservadas no', () => {
    const map = occupancy([
      ['platea-F01-01', { status: 'confirmed', orderId: 'o1' }],
      ['platea-F01-02', { status: 'pending', orderId: 'o2' }],
    ])
    expect(isSelectable('platea-F01-01', map)).toBe(false)
    expect(isSelectable('platea-F01-02', map)).toBe(false)
  })
})

describe('orderIdAt', () => {
  it('devuelve la orden de una vendida o reservada', () => {
    const map = occupancy([
      ['platea-F01-01', { status: 'confirmed', orderId: 'o1' }],
      ['platea-F01-02', { status: 'pending', orderId: 'o2' }],
    ])
    expect(orderIdAt('platea-F01-01', map)).toBe('o1')
    expect(orderIdAt('platea-F01-02', map)).toBe('o2')
  })

  it('una bloqueada o una libre no tienen orden', () => {
    const map = occupancy([['platea-F01-01', { status: 'blocked', orderId: null }]])
    expect(orderIdAt('platea-F01-01', map)).toBeNull()
    expect(orderIdAt('platea-F09-09', map)).toBeNull()
  })
})

describe('selectionAction', () => {
  it('sin selección no hay acción', () => {
    expect(selectionAction(new Set(), occupancy([]))).toBe('none')
  })

  it('sólo libres se bloquean', () => {
    expect(selectionAction(new Set(['platea-F01-01', 'platea-F01-02']), occupancy([]))).toBe(
      'block',
    )
  })

  it('sólo bloqueadas se liberan', () => {
    const map = occupancy([
      ['platea-F01-01', { status: 'blocked', orderId: null }],
      ['platea-F01-02', { status: 'blocked', orderId: null }],
    ])
    expect(selectionAction(new Set(['platea-F01-01', 'platea-F01-02']), map)).toBe('unblock')
  })

  it('mezclar libres con bloqueadas no es una acción válida', () => {
    const map = occupancy([['platea-F01-02', { status: 'blocked', orderId: null }]])
    expect(selectionAction(new Set(['platea-F01-01', 'platea-F01-02']), map)).toBe('mixed')
  })

  it('una butaca que se vendió mientras estaba elegida invalida la acción', () => {
    const map = occupancy([['platea-F01-01', { status: 'confirmed', orderId: 'o1' }]])
    expect(selectionAction(new Set(['platea-F01-01', 'platea-F01-02']), map)).toBe('mixed')
  })
})
