import { describe, it, expect } from 'vitest'
import {
  rowRadius,
  offsetToTheta,
  placeOnArc,
  placeAtOffset,
  boundingBox,
} from '@/lib/geometry'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'

const g = TEATRO_DEL_GLOBO.geometry
const CENTER = g.center
const R0 = g.firstRowRadius
const ROW_PITCH = g.rowPitch
const SEAT_PITCH = g.seatPitch

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y)

describe('rowRadius', () => {
  it('la fila 1 tiene radio R0', () => {
    expect(rowRadius(g, 1)).toBe(R0)
  })

  it('cada fila suma un ROW_PITCH', () => {
    expect(rowRadius(g, 15)).toBe(R0 + 14 * ROW_PITCH)
  })
})

describe('placeAtOffset', () => {
  it('el centro de la fila cae justo debajo del centro de curvatura', () => {
    const p = placeAtOffset(g, 1, 0)
    expect(p.x).toBeCloseTo(CENTER.x, 6)
    expect(p.y).toBeCloseTo(CENTER.y + R0, 6)
    expect(p.angle).toBeCloseTo(0, 6)
  })

  it('mantiene el paso entre butacas contiguas en la fila 1', () => {
    const a = placeAtOffset(g, 1, 0)
    const b = placeAtOffset(g, 1, 1)
    expect(dist(a, b)).toBeCloseTo(SEAT_PITCH, 1)
  })

  it('mantiene el MISMO paso en la fila 15, aunque el radio sea mayor', () => {
    const a = placeAtOffset(g, 15, 0)
    const b = placeAtOffset(g, 15, 1)
    expect(dist(a, b)).toBeCloseTo(SEAT_PITCH, 1)
  })

  it('las filas curvan en el sentido del plano: los extremos quedan más cerca del escenario', () => {
    const centro = placeAtOffset(g, 1, 0)
    const extremo = placeAtOffset(g, 1, 6.5)
    expect(extremo.y).toBeLessThan(centro.y)
  })

  it('es simétrica respecto del eje vertical', () => {
    const izq = placeAtOffset(g, 8, -5)
    const der = placeAtOffset(g, 8, 5)
    expect(izq.x).toBeCloseTo(-der.x, 6)
    expect(izq.y).toBeCloseTo(der.y, 6)
    expect(izq.angle).toBeCloseTo(-der.angle, 6)
  })

  it('rota cada butaca para que encare al centro de curvatura', () => {
    const offset = 6
    const p = placeAtOffset(g, 10, offset)
    const a = (p.angle * Math.PI) / 180
    const up = { x: Math.sin(a), y: -Math.cos(a) }
    const hacia = { x: CENTER.x - p.x, y: CENTER.y - p.y }
    const norma = Math.hypot(hacia.x, hacia.y)
    expect(up.x).toBeCloseTo(hacia.x / norma, 6)
    expect(up.y).toBeCloseTo(hacia.y / norma, 6)
  })

  it('el ángulo en grados crece con el offset', () => {
    expect(placeAtOffset(g, 5, 3).angle).toBeLessThan(placeAtOffset(g, 5, 1).angle)
  })

  it('usa la geometría que recibe, no constantes globales', () => {
    const otra = { ...g, firstRowRadius: 1000, rowPitch: 50 }
    expect(rowRadius(otra, 2)).toBe(1050)
    expect(placeAtOffset(otra, 1, 0).y).toBeCloseTo(1000, 6)
  })
})

describe('offsetToTheta', () => {
  it('el mismo offset da un ángulo menor en un radio mayor', () => {
    expect(offsetToTheta(g, 5, 720)).toBeCloseTo(offsetToTheta(g, 5, 360) / 2, 9)
  })
})

describe('placeOnArc', () => {
  it('todos los puntos del arco están a distancia radius del centro', () => {
    for (const t of [-0.4, 0, 0.2, 0.5]) {
      const p = placeOnArc(g, 400, t)
      expect(dist(p, CENTER)).toBeCloseTo(400, 6)
    }
  })
})

describe('boundingBox', () => {
  it('encierra todos los puntos y agrega el padding', () => {
    const box = boundingBox([{ x: -10, y: 5 }, { x: 30, y: 45 }], 10)
    expect(box).toEqual({ x: -20, y: -5, width: 60, height: 60 })
  })

  it('rechaza una lista vacía en vez de devolver NaN', () => {
    expect(() => boundingBox([], 10)).toThrow()
  })
})
