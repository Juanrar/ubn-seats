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
  it('genera 302 butacas en total', () => {
    expect(seats).toHaveLength(302)
  })

  it('genera 236 butacas en el bloque central y 33 por ala', () => {
    expect(bySector('platea')).toHaveLength(236)
    expect(bySector('platea-ala-izq')).toHaveLength(33)
    expect(bySector('platea-ala-der')).toHaveLength(33)
  })

  it('no repite ids', () => {
    expect(new Set(seats.map((s) => s.id)).size).toBe(seats.length)
  })

  it('deriva el id de sector, fila y número', () => {
    expect(pick(7, 12).id).toBe('platea-F07-12')
  })

  it('indexa las butacas por id', () => {
    expect(venue.byId.size).toBe(302)
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

  it('asigna precio a toda butaca', () => {
    expect(seats.every((s) => s.price > 0)).toBe(true)
  })
})

describe('buildVenue — etiquetas', () => {
  it('describe la butaca en español, con su franja', () => {
    expect(pick(7, 12).label).toBe('Fila 7, butaca 12, Platea B')
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

  it('bounds encierra todas las butacas', () => {
    const { bounds } = venue
    for (const s of seats) {
      expect(s.x).toBeGreaterThanOrEqual(bounds.x)
      expect(s.x).toBeLessThanOrEqual(bounds.x + bounds.width)
      expect(s.y).toBeGreaterThanOrEqual(bounds.y)
      expect(s.y).toBeLessThanOrEqual(bounds.y + bounds.height)
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

  it('el viewBox contiene el escenario y todas las butacas', () => {
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

  it('cada fila trae sus butacas ordenadas por x', () => {
    for (const { seats: rowSeats } of venue.rows) {
      const xs = rowSeats.map((s) => s.x)
      expect(xs).toEqual([...xs].sort((a, b) => a - b))
    }
  })

  it('reparte todas las butacas entre las filas sin perder ninguna', () => {
    expect(venue.rows.reduce((n, r) => n + r.seats.length, 0)).toBe(302)
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
      { row: 1, center: 2, wing: 0 },
      { row: 2, center: 4, wing: 0 },
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

describe('buildVenue — filas', () => {
  const rowOf = (row: number) => venue.rows.find((r) => r.row === row)!

  it('asigna a cada fila la franja de su bloque central', () => {
    expect(rowOf(1).tier.label).toBe('Platea A')
    expect(rowOf(1).tier.price).toBe(45000)
    expect(rowOf(7).tier.label).toBe('Platea B')
    expect(rowOf(7).tier.price).toBe(38000)
    expect(rowOf(11).tier.label).toBe('Platea C')
    expect(rowOf(11).tier.price).toBe(30000)
  })

  it('usa la franja del ala en una fila sin bloque central', () => {
    expect(rowOf(16).tier.label).toBe('Ala lateral')
    expect(rowOf(16).tier.price).toBe(24000)
  })

  it('da a cada fila un viewBox propio que contiene sus butacas', () => {
    const row = rowOf(7)
    const [x, y, w, h] = row.viewBox.split(' ').map(Number)
    const xs = row.seats.map((s) => s.x)
    const ys = row.seats.map((s) => s.y)
    expect(x).toBeLessThan(Math.min(...xs))
    expect(y).toBeLessThan(Math.min(...ys))
    expect(x + w).toBeGreaterThan(Math.max(...xs))
    expect(y + h).toBeGreaterThan(Math.max(...ys))
  })

  it('encuadra más angosta la fila más angosta que la más ancha', () => {
    const wide = Number(rowOf(7).viewBox.split(' ')[2])
    const narrow = Number(rowOf(1).viewBox.split(' ')[2])
    expect(narrow).toBeLessThan(wide)
  })

  it('redondea los cuatro números del viewBox de cada fila', () => {
    for (const row of venue.rows) {
      for (const n of row.viewBox.split(' ')) {
        expect(n).toBe(String(Math.round(Number(n) * 1000) / 1000))
      }
    }
  })

  it('cubre las 16 filas', () => {
    expect(venue.rows).toHaveLength(16)
    expect(venue.rows.map((r) => r.row)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    ])
  })
})

describe('buildVenue — franjas de tarifa', () => {
  const sinY = (bands: typeof venue.tierBands) =>
    bands.map(({ label, price, fromRow, throughRow }) => ({ label, price, fromRow, throughRow }))

  it('deriva las franjas del bloque central con sus filas', () => {
    expect(sinY(venue.tierBands)).toEqual([
      { label: 'Platea A', price: 45000, fromRow: 1, throughRow: 5 },
      { label: 'Platea B', price: 38000, fromRow: 6, throughRow: 10 },
      { label: 'Platea C', price: 30000, fromRow: 11, throughRow: 16 },
    ])
  })

  it('no hardcodea los límites: otro plano da otras franjas', () => {
    const synthetic: VenuePlan = {
      ...TEATRO_DEL_GLOBO,
      rows: [
        { row: 1, center: 4, wing: 0 },
        { row: 2, center: 4, wing: 0 },
        { row: 3, center: 4, wing: 0 },
      ],
      centerBlock: {
        sector: 'platea',
        tiers: [
          { label: 'Frente', price: 100, throughRow: 1 },
          { label: 'Fondo', price: 50 },
        ],
      },
    }
    expect(sinY(buildVenue(synthetic).tierBands)).toEqual([
      { label: 'Frente', price: 100, fromRow: 1, throughRow: 1 },
      { label: 'Fondo', price: 50, fromRow: 2, throughRow: 3 },
    ])
  })

  it('redondea la y de cada franja a 3 decimales', () => {
    for (const band of venue.tierBands) {
      expect(band.y).toBe(Math.round(band.y * 1000) / 1000)
    }
  })

  it('el rótulo de cada franja queda a la izquierda de todas las butacas, aunque su primera fila tenga alas', () => {
    for (const seat of venue.seats) {
      expect(venue.tierLabelX).toBeLessThan(seat.x)
    }
  })

  it('el rótulo de franja usa la misma x aunque la fila arranque con alas', () => {
    const xs = new Set(venue.tierBands.map(() => venue.tierLabelX))
    expect(xs.size).toBe(1)
  })

  it('la y de cada franja queda a la altura del rótulo de fila de su primera fila, no de sus butacas', () => {
    for (const band of venue.tierBands) {
      const firstRow = venue.rows.find((row) => row.row === band.fromRow)!
      expect(band.y).toBeCloseTo(firstRow.labelY, 3)
    }
  })
})

describe('buildVenue — rótulos de fila', () => {
  it('cada fila tiene una y de rótulo distinta de la de sus vecinas, sin importar si tiene bloque central', () => {
    const labelYs = venue.rows.map((row) => row.labelY)
    for (let i = 1; i < labelYs.length; i++) {
      expect(labelYs[i]).not.toBe(labelYs[i - 1])
      expect(labelYs[i] - labelYs[i - 1]).toBeCloseTo(TEATRO_DEL_GLOBO.geometry.rowPitch, 3)
    }
  })

  it('no depende de las butacas de la fila: una fila sin bloque central igual queda separada', () => {
    const synthetic: VenuePlan = {
      ...TEATRO_DEL_GLOBO,
      rows: [
        { row: 1, center: 4, wing: 3 },
        { row: 2, center: 0, wing: 3 },
      ],
    }
    const rows = buildVenue(synthetic).rows
    expect(rows[1].labelY).not.toBe(rows[0].labelY)
    expect(rows[1].labelY - rows[0].labelY).toBeCloseTo(synthetic.geometry.rowPitch, 3)
  })
})
