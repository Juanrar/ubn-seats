import { MAX_SEATS } from '@/lib/constants'
import { boundingBox, type Box } from '@/lib/geometry'
import type { Seat, StagePlan, VenuePlan } from '@/lib/types'
import { buildSeats, round3, seatBounds } from '@/lib/venue/catalog'

export interface VenueRow {
  row: number
  seats: Seat[]
}

export interface Venue {
  plan: VenuePlan
  seats: Seat[]
  byId: Map<string, Seat>
  rows: VenueRow[]
  bounds: Box
  viewBox: string
  stage: StagePlan
  maxSeats: number
}

function groupByRow(seats: Seat[]): VenueRow[] {
  const groups = new Map<number, Seat[]>()
  for (const seat of seats) {
    const list = groups.get(seat.row)
    if (list) list.push(seat)
    else groups.set(seat.row, [seat])
  }
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([row, rowSeats]) => ({ row, seats: [...rowSeats].sort((a, b) => a.x - b.x) }))
}

function frameViewBox(plan: VenuePlan, bounds: Box): string {
  const { stage, framePadding } = plan
  const box = boundingBox(
    [
      { x: bounds.x, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { x: stage.x, y: stage.y },
      { x: stage.x + stage.width, y: stage.y + stage.height },
    ],
    framePadding,
  )
  return `${round3(box.x)} ${round3(box.y)} ${round3(box.width)} ${round3(box.height)}`
}

export function buildVenue(plan: VenuePlan, maxSeats: number = MAX_SEATS): Venue {
  const seats = buildSeats(plan)
  const bounds = seatBounds(plan, seats)
  return {
    plan,
    seats,
    byId: new Map(seats.map((seat) => [seat.id, seat])),
    rows: groupByRow(seats),
    bounds,
    viewBox: frameViewBox(plan, bounds),
    stage: plan.stage,
    maxSeats,
  }
}
