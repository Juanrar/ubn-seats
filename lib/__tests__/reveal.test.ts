import { describe, it, expect } from 'vitest'
import { buildRevealDelays } from '@/lib/reveal'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'
import type { Seat, StagePlan } from '@/lib/types'

const venue = buildVenue(TEATRO_DEL_GLOBO)
const { seats, stage } = venue

describe('buildRevealDelays', () => {
  it('devuelve un delay para cada butaca del catálogo', () => {
    const delays = buildRevealDelays(seats, stage)
    expect(delays.size).toBe(seats.length)
    for (const seat of seats) expect(delays.has(seat.id)).toBe(true)
  })

  it('la butaca más lejana del escenario llega al delay máximo', () => {
    const delays = buildRevealDelays(seats, stage)
    const max = Math.max(...delays.values())
    expect(max).toBe(950)
  })

  it('ninguna butaca supera el delay máximo configurado', () => {
    const delays = buildRevealDelays(seats, stage)
    for (const value of delays.values()) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(950)
    }
  })

  it('una butaca más cerca del escenario tiene menos delay que una más lejana', () => {
    const delays = buildRevealDelays(seats, stage)
    const cerca = seats.find((s) => s.sector === 'platea' && s.row === 1 && s.number === 1)!
    const lejos = seats.find((s) => s.sector === 'platea-ala-izq' && s.row === 16)!
    expect(delays.get(cerca.id)!).toBeLessThan(delays.get(lejos.id)!)
  })

  it('es determinista', () => {
    const a = buildRevealDelays(seats, stage)
    const b = buildRevealDelays(seats, stage)
    expect([...a.entries()].sort()).toEqual([...b.entries()].sort())
  })

  it('no depende del orden en que llegan las butacas', () => {
    const a = buildRevealDelays(seats, stage)
    const b = buildRevealDelays([...seats].reverse(), stage)
    expect([...a.entries()].sort()).toEqual([...b.entries()].sort())
  })

  it('respeta un delay máximo distinto al default', () => {
    const delays = buildRevealDelays(seats, stage, 1000)
    expect(Math.max(...delays.values())).toBe(1000)
  })

  it('con una sola butaca en el origen del escenario no rompe (sin NaN)', () => {
    const stageOnly: StagePlan = { x: 0, y: 0, width: 100, height: 50, label: 'Escenario' }
    const soloAsiento: Seat[] = [
      { ...seats[0], x: stageOnly.x + stageOnly.width / 2, y: stageOnly.y + stageOnly.height },
    ]
    const delays = buildRevealDelays(soloAsiento, stageOnly)
    expect(delays.get(soloAsiento[0].id)).toBe(0)
  })
})
