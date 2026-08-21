import { describe, it, expect } from 'vitest'
import { VENUE_ROWS } from '@/lib/venue'

const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0)

describe('VENUE_ROWS', () => {
  it('tiene 16 filas numeradas de 1 a 16 sin huecos', () => {
    expect(VENUE_ROWS).toHaveLength(16)
    expect(VENUE_ROWS.map((r) => r.row)).toEqual(
      Array.from({ length: 16 }, (_, i) => i + 1),
    )
  })

  it('el bloque central suma 236 butacas', () => {
    expect(sum(VENUE_ROWS.map((r) => r.center))).toBe(236)
  })

  it('las filas 1 y 15 tienen 14 butacas centrales', () => {
    expect(VENUE_ROWS[0].center).toBe(14)
    expect(VENUE_ROWS[14].center).toBe(14)
  })

  it('las filas 2 a 14 tienen 16 butacas centrales', () => {
    for (const r of VENUE_ROWS.slice(1, 14)) expect(r.center).toBe(16)
  })

  it('la fila 16 existe solo en las alas', () => {
    expect(VENUE_ROWS[15].center).toBe(0)
    expect(VENUE_ROWS[15].wing).toBe(3)
  })

  it('las alas van de la fila 6 a la 16 con 3 butacas por lado', () => {
    for (const r of VENUE_ROWS) {
      expect(r.wing).toBe(r.row >= 6 ? 3 : 0)
    }
    expect(sum(VENUE_ROWS.map((r) => r.wing)) * 2).toBe(66)
  })

  it('los espacios accesibles están en las filas 1, 4 y 14', () => {
    const filas = VENUE_ROWS.filter((r) => r.accessible).map((r) => r.row)
    expect(filas).toEqual([1, 4, 14])
  })

  it('todas las filas centrales tienen cantidad par de butacas', () => {
    for (const r of VENUE_ROWS) expect(r.center % 2).toBe(0)
  })
})
