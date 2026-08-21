import { describe, it, expect } from 'vitest'
import { buildSeats, seatBounds, seatLabel } from '@/lib/seats'
import type { Seat } from '@/lib/types'

const seats = buildSeats()
const bySector = (s: string) => seats.filter((x) => x.sector === s)

describe('buildSeats — inventario', () => {
  it('genera 308 plazas en total', () => {
    expect(seats).toHaveLength(308)
  })

  it('genera 236 butacas en el bloque central', () => {
    expect(bySector('platea')).toHaveLength(236)
  })

  it('genera 33 butacas por ala', () => {
    expect(bySector('platea-ala-izq')).toHaveLength(33)
    expect(bySector('platea-ala-der')).toHaveLength(33)
  })

  it('genera 6 espacios accesibles', () => {
    expect(bySector('platea-accesible')).toHaveLength(6)
  })

  it('marca los accesibles con kind accessible y el resto con standard', () => {
    for (const s of seats) {
      expect(s.kind).toBe(s.sector === 'platea-accesible' ? 'accessible' : 'standard')
    }
  })

  it('no repite ids', () => {
    expect(new Set(seats.map((s) => s.id)).size).toBe(seats.length)
  })

  it('deriva el id de sector, fila y número', () => {
    const s = seats.find((x) => x.sector === 'platea' && x.row === 7 && x.number === 12)!
    expect(s.id).toBe('platea-F07-12')
  })
})

describe('buildSeats — numeración', () => {
  it('la fila 1 del bloque central va de 1 a 14', () => {
    const nums = seats
      .filter((s) => s.sector === 'platea' && s.row === 1)
      .map((s) => s.number)
      .sort((a, b) => a - b)
    expect(nums).toEqual(Array.from({ length: 14 }, (_, i) => i + 1))
  })

  it('el ala izquierda usa 17, 19 y 21 en cada fila', () => {
    const fila7 = bySector('platea-ala-izq')
      .filter((s) => s.row === 7)
      .map((s) => s.number)
      .sort((a, b) => a - b)
    expect(fila7).toEqual([17, 19, 21])
  })

  it('el ala derecha usa 18, 20 y 22 en cada fila', () => {
    const fila7 = bySector('platea-ala-der')
      .filter((s) => s.row === 7)
      .map((s) => s.number)
      .sort((a, b) => a - b)
    expect(fila7).toEqual([18, 20, 22])
  })

  it('la fila 16 solo tiene butacas de ala', () => {
    const fila16 = seats.filter((s) => s.row === 16)
    expect(fila16).toHaveLength(6)
    expect(fila16.every((s) => s.sector.startsWith('platea-ala'))).toBe(true)
  })
})

describe('buildSeats — posiciones', () => {
  it('coloca los accesibles en el pasillo, entre el bloque central y el ala', () => {
    const acc = bySector('platea-accesible').find((s) => s.row === 14 && s.x > 0)!
    const bordeCentral = seats
      .filter((s) => s.sector === 'platea' && s.row === 14)
      .reduce((max, s) => Math.max(max, s.x), -Infinity)
    const alaInterna = bySector('platea-ala-der')
      .filter((s) => s.row === 14)
      .reduce((min, s) => Math.min(min, s.x), Infinity)
    expect(acc.x).toBeGreaterThan(bordeCentral)
    expect(acc.x).toBeLessThan(alaInterna)
  })

  it('alinea la columna de alas: la butaca interna del ala cae casi en la misma x en las filas 6 a 16', () => {
    const xs = [6, 10, 15, 16].map(
      (row) =>
        bySector('platea-ala-der')
          .filter((s) => s.row === row)
          .reduce((min, s) => Math.min(min, s.x), Infinity),
    )
    const span = Math.max(...xs) - Math.min(...xs)
    expect(span).toBeLessThan(20)
  })

  it('las filas de atrás quedan más lejos del escenario', () => {
    const y = (row: number) =>
      seats.find((s) => s.sector === 'platea' && s.row === row && s.number === 1)!.y
    expect(y(15)).toBeGreaterThan(y(1))
  })

  it('coloca los 6 accesibles en las filas 1, 4 y 14, uno por lado', () => {
    const acc = bySector('platea-accesible')
    expect(acc.map((s) => s.row).sort((a, b) => a - b)).toEqual([1, 1, 4, 4, 14, 14])
    for (const row of [1, 4, 14]) {
      const par = acc.filter((s) => s.row === row)
      expect(par.some((s) => s.x < 0)).toBe(true)
      expect(par.some((s) => s.x > 0)).toBe(true)
    }
  })

  it('asigna precio a toda plaza', () => {
    expect(seats.every((s: Seat) => s.price > 0)).toBe(true)
  })
})

describe('seatBounds', () => {
  it('encierra todas las butacas', () => {
    const box = seatBounds(seats)
    for (const s of seats) {
      expect(s.x).toBeGreaterThanOrEqual(box.x)
      expect(s.x).toBeLessThanOrEqual(box.x + box.width)
      expect(s.y).toBeGreaterThanOrEqual(box.y)
      expect(s.y).toBeLessThanOrEqual(box.y + box.height)
    }
  })
})

describe('seatLabel', () => {
  it('describe la plaza en español', () => {
    const s = seats.find((x) => x.sector === 'platea' && x.row === 7 && x.number === 12)!
    expect(seatLabel(s)).toBe('Fila 7, butaca 12, Platea B')
  })

  it('nombra distinto a los espacios accesibles', () => {
    const s = bySector('platea-accesible').find((x) => x.row === 4)!
    expect(seatLabel(s)).toContain('Espacio accesible')
  })
})
