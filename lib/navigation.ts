import type { Seat } from '@/lib/types'

export type Direction = 'left' | 'right' | 'up' | 'down'

function rowOf(seats: Seat[], row: number): Seat[] {
  return seats.filter((s) => s.row === row).sort((a, b) => a.x - b.x)
}

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
