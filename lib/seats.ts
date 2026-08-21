import {
  AISLE_GAP,
  SEAT_HEIGHT,
  SEAT_WIDTH,
  WING_INNER_OFFSET,
} from '@/lib/constants'
import { boundingBox, placeAtOffset, type Box } from '@/lib/geometry'
import { centerRowNumbers, wingNumber } from '@/lib/numbering'
import { priceFor, tierLabel } from '@/lib/pricing'
import type { RowConfig, Seat, SectorId } from '@/lib/types'
import { VENUE_ROWS } from '@/lib/venue'

const pad2 = (n: number) => String(n).padStart(2, '0')

function seatId(sector: SectorId, row: number, number: number): string {
  return `${sector}-F${pad2(row)}-${number}`
}

/** Semianchura del bloque central de la fila, en unidades de SEAT_PITCH. */
function halfWidth(config: RowConfig): number {
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
    x,
    y,
    angle,
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
  if (seat.sector === 'platea-accesible') {
    return `Fila ${seat.row}, espacio accesible ${seat.number}, ${tierLabel(seat.sector, seat.row)}`
  }
  return `Fila ${seat.row}, butaca ${seat.number}, ${tierLabel(seat.sector, seat.row)}`
}
