import {
  AISLE_GAP,
  SEAT_HEIGHT,
  SEAT_WIDTH,
  WING_INNER_OFFSET,
} from '@/lib/constants'
import { boundingBox, placeAtOffset, type Box } from '@/lib/geometry'
import { centerRowNumbers, wingNumber } from '@/lib/numbering'
import { priceFor, tierLabel } from '@/lib/pricing'
import type { RowPlan, Seat, SectorId } from '@/lib/types'
import { VENUE_ROWS } from '@/lib/venue'

const pad2 = (n: number) => String(n).padStart(2, '0')

/**
 * Redondea a 3 decimales. Math.sin/cos no estan garantizados identicos bit a
 * bit entre implementaciones de JS, y esa diferencia de 1 ULP se serializa
 * distinto en el SVG del servidor y el del cliente, lo que hace que React
 * reporte un mismatch de hidratacion. A 24 unidades de paso de butaca, 3
 * decimales son invisibles. Se le suma 0 para normalizar -0 a 0, porque -0 se
 * serializa como "0" en algunos contextos y como "-0" en otros.
 */
export const round3 = (n: number): number => Math.round(n * 1000) / 1000 + 0

function describe(sector: SectorId, row: number, number: number): string {
  const tier = tierLabel(sector, row)
  if (sector === 'platea-accesible') {
    return `Fila ${row}, espacio accesible ${number}, ${tier}`
  }
  return `Fila ${row}, butaca ${number}, ${tier}`
}

function seatId(sector: SectorId, row: number, number: number): string {
  return `${sector}-F${pad2(row)}-${number}`
}

/** Semianchura del bloque central de la fila, en unidades de SEAT_PITCH. */
function halfWidth(config: RowPlan): number {
  return config.center > 0 ? (config.center - 1) / 2 : 0
}

function makeSeat(
  sector: SectorId,
  row: number,
  number: number,
  offset: number,
): Seat {
  const { x, y, angle } = placeAtOffset(row, offset)
  return {
    id: seatId(sector, row, number),
    sector,
    row,
    number,
    kind: sector === 'platea-accesible' ? 'accessible' : 'standard',
    price: priceFor(sector, row),
    tier: tierLabel(sector, row),
    label: describe(sector, row, number),
    x: round3(x),
    y: round3(y),
    angle: round3(angle),
  }
}

/**
 * Catálogo completo de plazas de la Platea, con posición ya calculada.
 *
 * Los offsets son unidades de SEAT_PITCH con signo desde el centro de la fila:
 * negativo hacia la izquierda, positivo hacia la derecha.
 */
export function buildSeats(): Seat[] {
  const seats: Seat[] = []

  for (const config of VENUE_ROWS) {
    const { row } = config
    const h = halfWidth(config)

    // Bloque central.
    const numbers = centerRowNumbers(config.center)
    numbers.forEach((number, k) => {
      seats.push(makeSeat('platea', row, number, k - (config.center - 1) / 2))
    })

    // Espacios accesibles: centrados en el pasillo, uno por lado.
    if (config.accessible) {
      const offset = h + 1 + AISLE_GAP / 2
      seats.push(makeSeat('platea-accesible', row, 1, -offset))
      seats.push(makeSeat('platea-accesible', row, 2, offset))
    }

    // Alas: en una columna recta, a offset fijo. Ver WING_INNER_OFFSET.
    for (let j = 0; j < config.wing; j++) {
      const offset = WING_INNER_OFFSET + j
      seats.push(makeSeat('platea-ala-izq', row, wingNumber('left', j), -offset))
      seats.push(makeSeat('platea-ala-der', row, wingNumber('right', j), offset))
    }
  }

  return seats
}

/**
 * Caja que encierra todas las butacas, con margen suficiente para que ninguna
 * quede cortada por su propio tamaño ni por la rotación.
 */
export function seatBounds(seats: Seat[]): Box {
  const diagonal = Math.hypot(SEAT_WIDTH, SEAT_HEIGHT) / 2
  return boundingBox(seats, diagonal)
}

/** Descripción de la plaza para aria-label y tooltip. */
export function seatLabel(seat: Seat): string {
  return seat.label
}
