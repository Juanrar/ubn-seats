import { describe, it, expect } from 'vitest'
import { TEATRO_DEL_GLOBO as plan } from '@/lib/plans/teatro-del-globo'

const rows = plan.rows
const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0)

describe('TEATRO_DEL_GLOBO — identidad', () => {
  it('nombra el recinto y el sector', () => {
    expect(plan.id).toBe('teatro-del-globo')
    expect(plan.name).toBe('Teatro del Globo')
    expect(plan.sectionName).toBe('Platea')
  })

  it('describe el escenario con su rótulo', () => {
    expect(plan.stage).toEqual({
      x: -270,
      y: 140,
      width: 540,
      height: 100,
      label: 'Escenario',
    })
  })

  it('mantiene WING_INNER_OFFSET constante y no derivado de la fila', () => {
    const { wingInnerOffset, aisleGap } = plan.geometry
    expect(wingInnerOffset).toBe(11)
    expect(wingInnerOffset).toBe(7.5 + 1 + aisleGap)
  })
})

describe('TEATRO_DEL_GLOBO — filas', () => {
  it('describe 16 filas numeradas de 1 a 16 sin huecos', () => {
    expect(rows).toHaveLength(16)
    expect(rows.map((r) => r.row)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1))
  })

  it('tiene 2 filas de 14 butacas centrales, 2 de 15 y 11 de 16', () => {
    expect(rows.filter((r) => r.center === 14).map((r) => r.row)).toEqual([1, 15])
    expect(rows.filter((r) => r.center === 15).map((r) => r.row)).toEqual([2, 14])
    expect(rows.filter((r) => r.center === 16)).toHaveLength(11)
  })

  it('el bloque central suma 234 butacas', () => {
    expect(sum(rows.map((r) => r.center))).toBe(234)
  })

  it('la fila 16 no tiene bloque central', () => {
    expect(rows[15].center).toBe(0)
  })
})

describe('TEATRO_DEL_GLOBO — alas', () => {
  it('las filas 1 a 5 no tienen alas', () => {
    for (const r of rows.slice(0, 5)) {
      expect(r.leftWing).toEqual([])
      expect(r.rightWing).toEqual([])
    }
  })

  it('numera las alas de las filas 6 a 13 con 17 19 21 a la izquierda y 18 20 22 a la derecha', () => {
    for (const r of rows.slice(5, 13)) {
      expect(r.leftWing).toEqual([17, 19, 21])
      expect(r.rightWing).toEqual([18, 20, 22])
    }
  })

  it('numera las alas de las filas 14 a 16 como en el plano', () => {
    expect(rows[13]).toMatchObject({ leftWing: [17, 19, 21], rightWing: [16, 18, 20] })
    expect(rows[14]).toMatchObject({ leftWing: [15, 17, 19], rightWing: [16, 18, 20] })
    expect(rows[15]).toMatchObject({ leftWing: [15, 17, 19], rightWing: [16, 18] })
  })

  it('el ala izquierda suma 33 butacas y la derecha 32', () => {
    expect(sum(rows.map((r) => r.leftWing.length))).toBe(33)
    expect(sum(rows.map((r) => r.rightWing.length))).toBe(32)
  })

  it('cada ala avanza de a dos desde el pasillo: impares a la izquierda, pares a la derecha', () => {
    for (const r of rows) {
      for (const [wing, parity] of [
        [r.leftWing, 1],
        [r.rightWing, 0],
      ] as const) {
        wing.forEach((number, i) => {
          expect(number % 2).toBe(parity)
          if (i > 0) expect(number - wing[i - 1]).toBe(2)
        })
      }
    }
  })
})

describe('TEATRO_DEL_GLOBO — franjas', () => {
  it('describe las tres franjas del bloque central en orden creciente de fila', () => {
    const tiers = plan.centerBlock.tiers
    expect(tiers.map((t) => t.label)).toEqual(['Platea A', 'Platea B', 'Platea C'])
    expect(tiers.map((t) => t.price)).toEqual([1, 2, 3])
    const bounded = tiers.slice(0, -1).map((t) => t.throughRow!)
    expect(bounded).toEqual([...bounded].sort((a, b) => a - b))
  })

  it('deja la última franja abierta para cubrir el resto de las filas', () => {
    const tiers = plan.centerBlock.tiers
    expect(tiers[tiers.length - 1].throughRow).toBeUndefined()
    for (const t of tiers.slice(0, -1)) expect(t.throughRow).toBeGreaterThan(0)
  })

  it('asigna un sector propio a cada zona', () => {
    expect(plan.centerBlock.sector).toBe('platea')
    expect(plan.wings.leftSector).toBe('platea-ala-izq')
    expect(plan.wings.rightSector).toBe('platea-ala-der')
  })
})
