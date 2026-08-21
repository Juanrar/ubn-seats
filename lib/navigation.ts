import type { Seat } from '@/lib/types'

export type Direction = 'left' | 'right' | 'up' | 'down'

function rowOf(seats: Seat[], row: number): Seat[] {
  return seats.filter((s) => s.row === row).sort((a, b) => a.x - b.x)
}

/**
 * Vecino de `currentId` en la dirección pedida.
 *
 * Izquierda y derecha se mueven por orden de x dentro de la fila. Arriba y
 * abajo saltan a la fila contigua y eligen la butaca más cercana en x, que es
 * lo que hace que la navegación funcione aunque las filas tengan distinta
 * cantidad de butacas o falte el bloque central (fila 16).
 *
 * En los bordes devuelve el mismo id: la selección no se pierde.
 */
export function nextSeatId(seats: Seat[], currentId: string, direction: Direction): string {
  const current = seats.find((s) => s.id === currentId)
  if (!current) return currentId

  if (direction === 'left' || direction === 'right') {
    const row = rowOf(seats, current.row)
    const index = row.findIndex((s) => s.id === currentId)
    const next = row[index + (direction === 'right' ? 1 : -1)]
    return next ? next.id : currentId
  }

  const targetRow = current.row + (direction === 'down' ? 1 : -1)
  const row = rowOf(seats, targetRow)
  if (row.length === 0) return currentId

  const closest = row.reduce((best, seat) =>
    Math.abs(seat.x - current.x) < Math.abs(best.x - current.x) ? seat : best,
  )
  return closest.id
}
