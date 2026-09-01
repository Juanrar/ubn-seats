import { describe, it, expect } from 'vitest'
import { mulberry32, buildOccupancy } from '@/lib/occupancy'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'
import { OCCUPANCY_RATE } from '@/lib/constants'

const seats = buildVenue(TEATRO_DEL_GLOBO).seats

describe('mulberry32', () => {
  it('devuelve la misma secuencia para la misma semilla', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('devuelve secuencias distintas para semillas distintas', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)())
  })

  it('se queda en el intervalo [0, 1)', () => {
    const rnd = mulberry32(7)
    for (let i = 0; i < 500; i++) {
      const v = rnd()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('buildOccupancy', () => {
  it('es determinista: dos corridas dan exactamente el mismo conjunto', () => {
    const a = buildOccupancy(seats)
    const b = buildOccupancy(seats)
    expect([...a].sort()).toEqual([...b].sort())
  })

  it('no depende del orden en que llegan las butacas', () => {
    const a = buildOccupancy(seats)
    const b = buildOccupancy([...seats].reverse())
    expect([...a].sort()).toEqual([...b].sort())
  })

  it('ocupa una proporción cercana a la tasa configurada', () => {
    const ocupadas = buildOccupancy(seats).size
    expect(ocupadas / seats.length).toBeGreaterThan(OCCUPANCY_RATE - 0.08)
    expect(ocupadas / seats.length).toBeLessThan(OCCUPANCY_RATE + 0.08)
  })

  it('solo devuelve ids que existen en el catálogo', () => {
    const ids = new Set(seats.map((s) => s.id))
    for (const id of buildOccupancy(seats)) expect(ids.has(id)).toBe(true)
  })

  it('cambia el resultado si cambia la semilla', () => {
    const a = [...buildOccupancy(seats, 1)].sort()
    const b = [...buildOccupancy(seats, 2)].sort()
    expect(a).not.toEqual(b)
  })

  it('con tasa 0 no ocupa nada', () => {
    expect(buildOccupancy(seats, 1, 0).size).toBe(0)
  })
})
