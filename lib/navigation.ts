import type { Seat } from '@/lib/types'

export type Direction = 'left' | 'right' | 'up' | 'down'

const NONE: ReadonlySet<string> = new Set()

function rowOf(seats: Seat[], row: number): Seat[] {
  return seats.filter((s) => s.row === row).sort((a, b) => a.x - b.x)
}

function closestTo(seats: Seat[], x: number): Seat | undefined {
  if (seats.length === 0) return undefined
  return seats.reduce((best, seat) =>
    Math.abs(seat.x - x) < Math.abs(best.x - x) ? seat : best,
  )
}

export function nextSeatId(
  seats: Seat[],
  currentId: string,
  direction: Direction,
  skip: ReadonlySet<string> = NONE,
): string {
  const current = seats.find((s) => s.id === currentId)
  if (!current) return currentId

  if (direction === 'left' || direction === 'right') {
    const row = rowOf(seats, current.row)
    const step = direction === 'right' ? 1 : -1
    let index = row.findIndex((s) => s.id === currentId) + step
    while (index >= 0 && index < row.length && skip.has(row[index].id)) index += step
    const next = row[index]
    return next ? next.id : currentId
  }

  const step = direction === 'down' ? 1 : -1
  let targetRow = current.row + step
  while (true) {
    const row = rowOf(seats, targetRow).filter((s) => !skip.has(s.id))
    if (row.length === 0) {
      if (rowOf(seats, targetRow).length === 0) return currentId
      targetRow += step
      continue
    }
    const closest = closestTo(row, current.x)
    return closest ? closest.id : currentId
  }
}
