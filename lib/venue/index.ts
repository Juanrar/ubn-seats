import { MAX_SEATS } from '@/lib/constants'
import { boundingBox, type Box } from '@/lib/geometry'
import type { Seat, StagePlan, TierPlan, VenuePlan } from '@/lib/types'
import { buildSeats, round3, seatBounds } from '@/lib/venue/catalog'
import { tierFor } from '@/lib/venue/pricing'

export interface VenueRow {
  row: number
  seats: Seat[]
  tier: TierPlan
  viewBox: string
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

function frameRow(plan: VenuePlan, seats: Seat[]): string {
  const box = seatBounds(plan, seats)
  const padded = boundingBox(
    [
      { x: box.x, y: box.y },
      { x: box.x + box.width, y: box.y + box.height },
    ],
    plan.geometry.seatPitch / 2,
  )
  return `${round3(padded.x)} ${round3(padded.y)} ${round3(padded.width)} ${round3(padded.height)}`
}

function rowTier(plan: VenuePlan, seats: Seat[]): TierPlan {
  const center = seats.find((seat) => seat.sector === plan.centerBlock.sector)
  return tierFor(plan, (center ?? seats[0]).sector, (center ?? seats[0]).row)
}

function groupByRow(plan: VenuePlan, seats: Seat[]): VenueRow[] {
  const groups = new Map<number, Seat[]>()
  for (const seat of seats) {
    const list = groups.get(seat.row)
    if (list) list.push(seat)
    else groups.set(seat.row, [seat])
  }
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([row, rowSeats]) => {
      const sorted = [...rowSeats].sort((a, b) => a.x - b.x)
      return { row, seats: sorted, tier: rowTier(plan, sorted), viewBox: frameRow(plan, sorted) }
    })
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
    rows: groupByRow(plan, seats),
    bounds,
    viewBox: frameViewBox(plan, bounds),
    stage: plan.stage,
    maxSeats,
  }
}
