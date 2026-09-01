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

  it('tiene 2 filas de 14 butacas centrales y 13 de 16', () => {
    expect(rows.filter((r) => r.center === 14).map((r) => r.row)).toEqual([1, 15])
    expect(rows.filter((r) => r.center === 16)).toHaveLength(13)
  })

  it('el bloque central suma 236 butacas', () => {
    expect(sum(rows.map((r) => r.center))).toBe(236)
  })

  it('la fila 16 no tiene bloque central', () => {
    expect(rows[15].center).toBe(0)
    expect(rows[15].wing).toBe(3)
  })

  it('las alas van de la fila 6 a la 16 con 3 butacas por lado', () => {
    for (const r of rows) expect(r.wing).toBe(r.row >= 6 ? 3 : 0)
    expect(sum(rows.map((r) => r.wing)) * 2).toBe(66)
  })

  it('todas las filas centrales tienen cantidad par de butacas', () => {
    for (const r of rows) expect(r.center % 2).toBe(0)
  })
})

describe('TEATRO_DEL_GLOBO — franjas', () => {
  it('describe las tres franjas del bloque central en orden creciente de fila', () => {
    const tiers = plan.centerBlock.tiers
    expect(tiers.map((t) => t.label)).toEqual(['Platea A', 'Platea B', 'Platea C'])
    expect(tiers.map((t) => t.price)).toEqual([45000, 38000, 30000])
    const bounded = tiers.slice(0, -1).map((t) => t.throughRow!)
    expect(bounded).toEqual([...bounded].sort((a, b) => a - b))
  })

  it('deja la última franja abierta para cubrir el resto de las filas', () => {
    const tiers = plan.centerBlock.tiers
    expect(tiers[tiers.length - 1].throughRow).toBeUndefined()
    for (const t of tiers.slice(0, -1)) expect(t.throughRow).toBeGreaterThan(0)
  })

  it('las alas tienen una sola tarifa', () => {
    expect(plan.wings.tier).toEqual({ label: 'Ala lateral', price: 24000 })
  })

  it('las alas continúan la numeración del bloque central', () => {
    expect(plan.wings.leftStartNumber).toBe(17)
    expect(plan.wings.rightStartNumber).toBe(18)
  })

  it('asigna un sector propio a cada zona', () => {
    expect(plan.centerBlock.sector).toBe('platea')
    expect(plan.wings.leftSector).toBe('platea-ala-izq')
    expect(plan.wings.rightSector).toBe('platea-ala-der')
  })
})
