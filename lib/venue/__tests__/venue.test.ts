import { describe, it, expect } from 'vitest'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'
import type { Seat, VenuePlan } from '@/lib/types'

const venue = buildVenue(TEATRO_DEL_GLOBO)
const seats = venue.seats
const geometry = TEATRO_DEL_GLOBO.geometry
const bySector = (sector: string) => seats.filter((s) => s.sector === sector)
const centerRow = (row: number) =>
  seats.filter((s) => s.sector === 'platea' && s.row === row).sort((a, b) => a.x - b.x)
const pick = (row: number, number: number) =>
  seats.find((s) => s.sector === 'platea' && s.row === row && s.number === number)!
const dist = (a: Seat, b: Seat) => Math.hypot(a.x - b.x, a.y - b.y)

describe('buildVenue — inventario', () => {
  it('genera 308 plazas en total', () => {
    expect(seats).toHaveLength(308)
  })

  it('genera 302 butacas y 6 espacios accesibles', () => {
    expect(seats.filter((s) => s.kind === 'standard')).toHaveLength(302)
    expect(seats.filter((s) => s.kind === 'accessible')).toHaveLength(6)
  })

  it('genera 236 butacas en el bloque central y 33 por ala', () => {
    expect(bySector('platea')).toHaveLength(236)
    expect(bySector('platea-ala-izq')).toHaveLength(33)
    expect(bySector('platea-ala-der')).toHaveLength(33)
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
    expect(pick(7, 12).id).toBe('platea-F07-12')
  })

  it('indexa las plazas por id', () => {
    expect(venue.byId.size).toBe(308)
    expect(venue.byId.get('platea-F07-12')).toBe(pick(7, 12))
  })

  it('expone el tope de butacas por compra', () => {
    expect(venue.maxSeats).toBe(8)
    expect(buildVenue(TEATRO_DEL_GLOBO, 3).maxSeats).toBe(3)
  })

  it('conserva el plano que lo generó', () => {
    expect(venue.plan).toBe(TEATRO_DEL_GLOBO)
    expect(venue.stage).toBe(TEATRO_DEL_GLOBO.stage)
  })
})

describe('buildVenue — numeración', () => {
  it('numera una fila de 14 como en el plano', () => {
    expect(centerRow(1).map((s) => s.number)).toEqual([
      13, 11, 9, 7, 5, 3, 1, 2, 4, 6, 8, 10, 12, 14,
    ])
  })

  it('numera una fila de 16 como en el plano', () => {
    expect(centerRow(7).map((s) => s.number)).toEqual([
      15, 13, 11, 9, 7, 5, 3, 1, 2, 4, 6, 8, 10, 12, 14, 16,
    ])
  })

  it('pone el 1 y el 2 en el centro de la fila', () => {
    for (const row of [1, 7]) {
      const nums = centerRow(row).map((s) => s.number)
      const n = nums.length
      expect(nums[n / 2 - 1]).toBe(1)
      expect(nums[n / 2]).toBe(2)
    }
  })

  it('deja los impares a la izquierda y los pares a la derecha', () => {
    const nums = centerRow(7).map((s) => s.number)
    expect(nums.slice(0, 8).every((x) => x % 2 === 1)).toBe(true)
    expect(nums.slice(8).every((x) => x % 2 === 0)).toBe(true)
  })

  it('usa exactamente 1..n en cada fila central', () => {
    const nums = centerRow(7).map((s) => s.number)
    expect([...nums].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 16 }, (_, i) => i + 1),
    )
  })

  it('el ala izquierda continúa la serie impar desde 17 hacia afuera', () => {
    const fila = bySector('platea-ala-izq')
      .filter((s) => s.row === 7)
      .sort((a, b) => b.x - a.x)
    expect(fila.map((s) => s.number)).toEqual([17, 19, 21])
  })

  it('el ala derecha continúa la serie par desde 18 hacia afuera', () => {
    const fila = bySector('platea-ala-der')
      .filter((s) => s.row === 7)
      .sort((a, b) => a.x - b.x)
    expect(fila.map((s) => s.number)).toEqual([18, 20, 22])
  })

  it('la fila 16 solo tiene butacas de ala', () => {
    const fila16 = seats.filter((s) => s.row === 16)
    expect(fila16).toHaveLength(6)
    expect(fila16.every((s) => s.sector.startsWith('platea-ala'))).toBe(true)
  })
})

describe('buildVenue — precios y franjas', () => {
  it('cobra Platea A en las filas 1 a 5 del bloque central', () => {
    for (const row of [1, 3, 5]) {
      expect(pick(row, 1).price).toBe(45000)
      expect(pick(row, 1).tier).toBe('Platea A')
    }
  })

  it('cobra Platea B en las filas 6 a 10', () => {
    for (const row of [6, 8, 10]) {
      expect(pick(row, 1).price).toBe(38000)
      expect(pick(row, 1).tier).toBe('Platea B')
    }
  })

  it('cobra Platea C en las filas 11 a 15', () => {
    for (const row of [11, 13, 15]) {
      expect(pick(row, 1).price).toBe(30000)
      expect(pick(row, 1).tier).toBe('Platea C')
    }
  })

  it('el sector manda sobre la fila: una butaca de ala en la fila 7 cuesta tarifa de ala', () => {
    const ala = bySector('platea-ala-izq').find((s) => s.row === 7)!
    expect(ala.price).toBe(24000)
    expect(ala.tier).toBe('Ala lateral')
    expect(bySector('platea-ala-der').find((s) => s.row === 16)!.price).toBe(24000)
  })

  it('cobra tarifa accesible en los espacios accesibles', () => {
    for (const s of bySector('platea-accesible')) {
      expect(s.price).toBe(24000)
      expect(s.tier).toBe('Espacio accesible')
    }
  })

  it('asigna precio a toda plaza', () => {
    expect(seats.every((s) => s.price > 0)).toBe(true)
  })
})

describe('buildVenue — etiquetas', () => {
  it('describe la butaca en español, con su franja', () => {
    expect(pick(7, 12).label).toBe('Fila 7, butaca 12, Platea B')
  })

  it('nombra distinto a los espacios accesibles', () => {
    const s = bySector('platea-accesible').find((x) => x.row === 4)!
    expect(s.label).toContain('Espacio accesible')
    expect(s.label).toContain('espacio accesible')
  })
})

describe('buildVenue — geometría', () => {
  it('mantiene el tamaño de butaca constante entre la fila 1 y la 15', () => {
    const fila1 = centerRow(1)
    const fila15 = centerRow(15)
    const paso1 = dist(fila1[0], fila1[1])
    const paso15 = dist(fila15[0], fila15[1])
    expect(paso1).toBeCloseTo(geometry.seatPitch, 1)
    expect(paso15).toBeCloseTo(geometry.seatPitch, 1)
  })

  it('rota cada butaca para que encare al centro de curvatura', () => {
    const s = centerRow(10)[2]
    const a = (s.angle * Math.PI) / 180
    const up = { x: Math.sin(a), y: -Math.cos(a) }
    const hacia = { x: geometry.center.x - s.x, y: geometry.center.y - s.y }
    const norma = Math.hypot(hacia.x, hacia.y)
    expect(up.x).toBeCloseTo(hacia.x / norma, 3)
    expect(up.y).toBeCloseTo(hacia.y / norma, 3)
  })

  it('curva las filas en el sentido del plano: los extremos quedan más cerca del escenario', () => {
    const fila = centerRow(7)
    const centro = fila[fila.length / 2]
    expect(fila[0].y).toBeLessThan(centro.y)
    expect(fila[fila.length - 1].y).toBeLessThan(centro.y)
  })

  it('pone las filas de atrás más lejos del escenario', () => {
    expect(pick(15, 1).y).toBeGreaterThan(pick(1, 1).y)
  })

  it('alinea la columna de alas aunque el bloque central se angoste', () => {
    const xs = [6, 10, 15, 16].map((row) =>
      bySector('platea-ala-der')
        .filter((s) => s.row === row)
        .reduce((min, s) => Math.min(min, s.x), Infinity),
    )
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(20)
  })

  it('redondea x, y y angle a 3 decimales, sin -0', () => {
    const decimals = (n: number): number => {
      const s = n.toString()
      const i = s.indexOf('.')
      return i === -1 ? 0 : s.length - i - 1
    }
    for (const s of seats) {
      expect(decimals(s.x)).toBeLessThanOrEqual(3)
      expect(decimals(s.y)).toBeLessThanOrEqual(3)
      expect(decimals(s.angle)).toBeLessThanOrEqual(3)
      expect(Object.is(s.x, -0)).toBe(false)
      expect(Object.is(s.y, -0)).toBe(false)
      expect(Object.is(s.angle, -0)).toBe(false)
    }
  })

  it('bounds encierra todas las plazas', () => {
    const { bounds } = venue
    for (const s of seats) {
      expect(s.x).toBeGreaterThanOrEqual(bounds.x)
      expect(s.x).toBeLessThanOrEqual(bounds.x + bounds.width)
      expect(s.y).toBeGreaterThanOrEqual(bounds.y)
      expect(s.y).toBeLessThanOrEqual(bounds.y + bounds.height)
    }
  })
})

describe('buildVenue — espacios accesibles', () => {
  it('los coloca en el pasillo, entre el bloque central y el ala', () => {
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

  it('pone 6 accesibles en las filas 1, 4 y 14, uno por lado', () => {
    const acc = bySector('platea-accesible')
    expect(acc.map((s) => s.row).sort((a, b) => a - b)).toEqual([1, 1, 4, 4, 14, 14])
    for (const row of [1, 4, 14]) {
      const par = acc.filter((s) => s.row === row)
      expect(par.some((s) => s.x < 0)).toBe(true)
      expect(par.some((s) => s.x > 0)).toBe(true)
    }
  })
})

describe('buildVenue — encuadre', () => {
  it('el viewBox tiene cuatro números con a lo sumo 3 decimales', () => {
    const parts = venue.viewBox.split(' ')
    expect(parts).toHaveLength(4)
    for (const part of parts) {
      expect(Number.isFinite(Number(part))).toBe(true)
      const i = part.indexOf('.')
      if (i !== -1) expect(part.length - i - 1).toBeLessThanOrEqual(3)
    }
  })

  it('el viewBox contiene el escenario y todas las plazas', () => {
    const [x, y, w, h] = venue.viewBox.split(' ').map(Number)
    const stage = TEATRO_DEL_GLOBO.stage
    expect(x).toBeLessThan(stage.x)
    expect(y).toBeLessThan(stage.y)
    expect(x + w).toBeGreaterThan(stage.x + stage.width)
    for (const s of seats) {
      expect(s.x).toBeGreaterThan(x)
      expect(s.x).toBeLessThan(x + w)
      expect(s.y).toBeGreaterThan(y)
      expect(s.y).toBeLessThan(y + h)
    }
  })
})

describe('buildVenue — filas agrupadas', () => {
  it('trae 16 entradas ordenadas por número de fila', () => {
    expect(venue.rows).toHaveLength(16)
    expect(venue.rows.map((r) => r.row)).toEqual(
      Array.from({ length: 16 }, (_, i) => i + 1),
    )
  })

  it('cada fila trae sus plazas ordenadas por x', () => {
    for (const { seats: rowSeats } of venue.rows) {
      const xs = rowSeats.map((s) => s.x)
      expect(xs).toEqual([...xs].sort((a, b) => a - b))
    }
  })

  it('reparte todas las plazas entre las filas sin perder ninguna', () => {
    expect(venue.rows.reduce((n, r) => n + r.seats.length, 0)).toBe(308)
  })
})

describe('buildVenue — el plano es dato', () => {
  const sintetico: VenuePlan = {
    id: 'sala-sintetica',
    name: 'Sala sintética',
    sectionName: 'Única',
    geometry: {
      seatWidth: 10,
      seatHeight: 8,
      seatPitch: 12,
      rowPitch: 13,
      firstRowRadius: 100,
      center: { x: 0, y: 0 },
      aisleGap: 2,
      wingInnerOffset: 5,
    },
    stage: { x: -50, y: 40, width: 100, height: 20, label: 'TABLADO' },
    rows: [
      { row: 1, center: 2, wing: 0, accessible: false },
      { row: 2, center: 4, wing: 0, accessible: false },
    ],
    centerBlock: {
      sector: 'platea',
      tiers: [
        { label: 'Frente', price: 1000, throughRow: 1 },
        { label: 'Fondo', price: 500 },
      ],
    },
    wings: {
      leftSector: 'platea-ala-izq',
      rightSector: 'platea-ala-der',
      leftStartNumber: 17,
      rightStartNumber: 18,
      tier: { label: 'Ala', price: 100 },
    },
    accessible: {
      sector: 'platea-accesible',
      tier: { label: 'Accesible', price: 100 },
    },
    framePadding: 5,
  }

  const otro = buildVenue(sintetico)

  it('genera sólo el catálogo que el plano describe', () => {
    expect(otro.seats).toHaveLength(6)
    expect(otro.rows.map((r) => r.seats.length)).toEqual([2, 4])
    expect(otro.seats.every((s) => s.sector === 'platea')).toBe(true)
  })

  it('numera cada fila según su ancho', () => {
    expect(otro.rows[0].seats.map((s) => s.number)).toEqual([1, 2])
    expect(otro.rows[1].seats.map((s) => s.number)).toEqual([3, 1, 2, 4])
  })

  it('aplica las franjas del plano sintético', () => {
    expect(otro.rows[0].seats[0].tier).toBe('Frente')
    expect(otro.rows[0].seats[0].price).toBe(1000)
    expect(otro.rows[1].seats[0].tier).toBe('Fondo')
    expect(otro.rows[1].seats[0].price).toBe(500)
  })

  it('usa la geometría del plano sintético', () => {
    const fila1 = otro.rows[0].seats
    expect(dist(fila1[0], fila1[1])).toBeCloseTo(sintetico.geometry.seatPitch, 1)
    expect(fila1[0].y).toBeCloseTo(sintetico.geometry.firstRowRadius, 0)
  })

  it('encuadra con el escenario y el padding del plano sintético', () => {
    const [, y] = otro.viewBox.split(' ').map(Number)
    expect(y).toBeLessThan(sintetico.stage.y)
  })
})
