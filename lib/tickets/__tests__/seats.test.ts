import { describe, it, expect } from 'vitest'
import { buildVenue } from '@/lib/venue'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { resolveTicketSeats } from '@/lib/tickets/seats'

describe('resolveTicketSeats', () => {
  it('ordena las butacas por fila y después por número', () => {
    const seats = resolveTicketSeats(['platea-ala-izq-F16-19', 'platea-F07-12', 'platea-F07-11'])

    expect(seats.map((seat) => [seat.row, seat.number])).toEqual([
      [7, 11],
      [7, 12],
      [16, 19],
    ])
  })

  it('ignora identificadores que no existen en la sala', () => {
    expect(resolveTicketSeats(['platea-F07-12', 'platea-F99-1']).map((seat) => seat.id)).toEqual([
      'platea-F07-12',
    ])
  })

  it('fila y número alcanzan para identificar una butaca en la entrada', () => {
    const keys = buildVenue(TEATRO_DEL_GLOBO).seats.map((seat) => `${seat.row}-${seat.number}`)

    expect(new Set(keys).size).toBe(keys.length)
  })
})
