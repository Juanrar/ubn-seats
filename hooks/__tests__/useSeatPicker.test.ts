import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useSeatPicker } from '@/hooks/useSeatPicker'
import { nextSeatId } from '@/lib/navigation'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'

const venue = buildVenue(TEATRO_DEL_GLOBO)
const seats = venue.seats
const MAX = venue.maxSeats
const libres = seats.filter((s) => s.sector === 'platea').slice(0, MAX + 3)
const ocupada = seats.find((s) => s.sector === 'platea' && s.row === 3)!
const pick = (row: number, number: number) =>
  seats.find((s) => s.sector === 'platea' && s.row === row && s.number === number)!

const picker = (occupied: Set<string> = new Set()) =>
  renderHook(() => useSeatPicker(venue, occupied))

const key = (k: string) =>
  ({ key: k, preventDefault: () => {} }) as React.KeyboardEvent<SVGSVGElement>

describe('useSeatPicker — selección', () => {
  it('arranca sin nada seleccionado', () => {
    const { result } = picker()
    expect(result.current.selectedSeats).toEqual([])
    expect(result.current.total).toBe(0)
    expect(result.current.limitReached).toBe(false)
  })

  it('agrega una butaca al tocarla', () => {
    const { result } = picker()
    act(() => result.current.toggle(libres[0]))
    expect(result.current.selectedSeats).toEqual([libres[0]])
  })

  it('la saca al tocarla de nuevo', () => {
    const { result } = picker()
    act(() => result.current.toggle(libres[0]))
    act(() => result.current.toggle(libres[0]))
    expect(result.current.selectedSeats).toHaveLength(0)
  })

  it('ignora las butacas ocupadas incluso llamando a toggle a mano', () => {
    const { result } = picker(new Set([ocupada.id]))
    act(() => result.current.toggle(ocupada))
    expect(result.current.selectedSeats).toHaveLength(0)
  })

  it(`no pasa de ${MAX} butacas`, () => {
    const { result } = picker()
    for (const seat of libres.slice(0, MAX + 2)) {
      act(() => result.current.toggle(seat))
    }
    expect(result.current.selectedSeats).toHaveLength(MAX)
  })

  it('avisa cuando se alcanzó el tope', () => {
    const { result } = picker()
    for (const seat of libres.slice(0, MAX)) act(() => result.current.toggle(seat))
    expect(result.current.limitReached).toBe(true)
  })

  it('deja de avisar cuando se libera un lugar', () => {
    const { result } = picker()
    for (const seat of libres.slice(0, MAX)) act(() => result.current.toggle(seat))
    act(() => result.current.toggle(libres[0]))
    expect(result.current.limitReached).toBe(false)
  })

  it('clear vacía la selección', () => {
    const { result } = picker()
    act(() => result.current.toggle(libres[0]))
    act(() => result.current.clear())
    expect(result.current.selectedSeats).toHaveLength(0)
    expect(result.current.total).toBe(0)
  })
})

describe('useSeatPicker — resumen', () => {
  it('devuelve la selección ordenada por fila y después por número', () => {
    const { result } = picker()
    for (const seat of [pick(12, 4), pick(2, 3), pick(2, 1)]) {
      act(() => result.current.toggle(seat))
    }
    expect(result.current.selectedSeats.map((s) => [s.row, s.number])).toEqual([
      [2, 1],
      [2, 3],
      [12, 4],
    ])
  })

  it('suma el total de la selección', () => {
    const { result } = picker()
    act(() => result.current.toggle(pick(2, 1)))
    act(() => result.current.toggle(pick(12, 4)))
    expect(result.current.total).toBe(75000)
  })
})

describe('useSeatPicker — estado de plaza', () => {
  it('deriva available, selected y occupied', () => {
    const { result } = picker(new Set([ocupada.id]))
    expect(result.current.statusOf(libres[0])).toBe('available')
    expect(result.current.statusOf(ocupada)).toBe('occupied')
    act(() => result.current.toggle(libres[0]))
    expect(result.current.statusOf(libres[0])).toBe('selected')
  })
})

describe('useSeatPicker — teclado', () => {
  it('arranca con el foco lógico en la primera plaza del catálogo', () => {
    const { result } = picker()
    expect(result.current.focusedId).toBe(seats[0].id)
  })

  it('las flechas mueven el foco lógico', () => {
    const { result } = picker()
    const inicial = result.current.focusedId
    act(() => result.current.onKeyDown(key('ArrowRight')))
    expect(result.current.focusedId).toBe(nextSeatId(seats, inicial, 'right'))
    expect(result.current.focusedId).not.toBe(inicial)
  })

  it('las cuatro flechas se despachan a la dirección correcta', () => {
    const { result } = picker()
    const partida = pick(7, 2)
    act(() => result.current.onSeatFocus(partida.id))
    for (const [tecla, direccion] of [
      ['ArrowLeft', 'left'],
      ['ArrowRight', 'right'],
      ['ArrowUp', 'up'],
      ['ArrowDown', 'down'],
    ] as const) {
      act(() => result.current.onSeatFocus(partida.id))
      act(() => result.current.onKeyDown(key(tecla)))
      expect(result.current.focusedId).toBe(nextSeatId(seats, partida.id, direccion))
    }
  })

  it('en el borde del mapa la flecha no pierde el foco', () => {
    const { result } = picker()
    const fila1 = venue.rows[0].seats
    act(() => result.current.onSeatFocus(fila1[0].id))
    act(() => result.current.onKeyDown(key('ArrowLeft')))
    expect(result.current.focusedId).toBe(fila1[0].id)
    act(() => result.current.onKeyDown(key('ArrowUp')))
    expect(result.current.focusedId).toBe(fila1[0].id)
  })

  it('ignora las teclas que no maneja', () => {
    const { result } = picker()
    const inicial = result.current.focusedId
    act(() => result.current.onKeyDown(key('Tab')))
    expect(result.current.focusedId).toBe(inicial)
    expect(result.current.selectedSeats).toHaveLength(0)
  })

  it('Enter alterna la plaza enfocada', () => {
    const { result } = picker()
    const objetivo = pick(9, 5)
    act(() => result.current.onSeatFocus(objetivo.id))
    act(() => result.current.onKeyDown(key('Enter')))
    expect(result.current.selectedSeats).toEqual([objetivo])
    act(() => result.current.onKeyDown(key('Enter')))
    expect(result.current.selectedSeats).toHaveLength(0)
  })

  it('el espacio también alterna la plaza enfocada', () => {
    const { result } = picker()
    const objetivo = pick(9, 5)
    act(() => result.current.onSeatFocus(objetivo.id))
    act(() => result.current.onKeyDown(key(' ')))
    expect(result.current.selectedSeats).toEqual([objetivo])
  })

  it('Enter elige la plaza a la que llegó la flecha, no la de partida', () => {
    const { result } = picker()
    const partida = pick(9, 5)
    const destino = venue.byId.get(nextSeatId(seats, partida.id, 'right'))!
    act(() => result.current.onSeatFocus(partida.id))
    act(() => result.current.onKeyDown(key('ArrowRight')))
    act(() => result.current.onKeyDown(key('Enter')))
    expect(result.current.selectedSeats).toEqual([destino])
  })

  it('Enter no selecciona una plaza ocupada', () => {
    const { result } = picker(new Set([ocupada.id]))
    act(() => result.current.onSeatFocus(ocupada.id))
    act(() => result.current.onKeyDown(key('Enter')))
    expect(result.current.selectedSeats).toHaveLength(0)
  })
})
