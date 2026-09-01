import { MAX_SEATS } from '@/lib/constants'
import { boundingBox, rowRadius, type Box } from '@/lib/geometry'
import type { Seat, StagePlan, TierPlan, VenuePlan } from '@/lib/types'
import { buildSeats, round3, seatBounds } from '@/lib/venue/catalog'
import { tierFor } from '@/lib/venue/pricing'

const TIER_LABEL_GAP = 12
const TIER_LABEL_CHAR_WIDTH = 7
const TIER_LABEL_PRICE_CHARS = 9

export interface VenueRow {
  row: number
  seats: Seat[]
  tier: TierPlan
  viewBox: string
  labelY: number
}

export interface TierBand {
  label: string
  price: number
  fromRow: number
  throughRow: number
  y: number
}

export interface Venue {
  plan: VenuePlan
  seats: Seat[]
  byId: Map<string, Seat>
  rows: VenueRow[]
  tierBands: TierBand[]
  bounds: Box
  viewBox: string
  tierLabelX: number
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

function rowLabelY(plan: VenuePlan, row: number): number {
  return round3(plan.geometry.center.y + rowRadius(plan.geometry, row))
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
      return {
        row,
        seats: sorted,
        tier: rowTier(plan, sorted),
        viewBox: frameRow(plan, sorted),
        labelY: rowLabelY(plan, row),
      }
    })
}

function tierLabelMargin(plan: VenuePlan): number {
  const longestLabel = plan.centerBlock.tiers.reduce(
    (max, tier) => Math.max(max, tier.label.length),
    0,
  )
  return TIER_LABEL_GAP + (longestLabel + TIER_LABEL_PRICE_CHARS) * TIER_LABEL_CHAR_WIDTH
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
  const margin = tierLabelMargin(plan)
  return `${round3(box.x - margin)} ${round3(box.y)} ${round3(box.width + margin)} ${round3(box.height)}`
}

function buildTierBands(plan: VenuePlan, rows: VenueRow[]): TierBand[] {
  const lastRow = rows[rows.length - 1].row
  const bands: TierBand[] = []
  let fromRow = rows[0].row
  for (const tier of plan.centerBlock.tiers) {
    const throughRow = tier.throughRow ?? lastRow
    const firstRow = rows.find((row) => row.row === fromRow)
    const y = firstRow ? firstRow.labelY : 0
    bands.push({ label: tier.label, price: tier.price, fromRow, throughRow, y })
    fromRow = throughRow + 1
  }
  return bands
}

export function buildVenue(plan: VenuePlan, maxSeats: number = MAX_SEATS): Venue {
  const seats = buildSeats(plan)
  const bounds = seatBounds(plan, seats)
  const rows = groupByRow(plan, seats)
  return {
    plan,
    seats,
    byId: new Map(seats.map((seat) => [seat.id, seat])),
    rows,
    tierBands: buildTierBands(plan, rows),
    bounds: {
      x: round3(bounds.x),
      y: round3(bounds.y),
      width: round3(bounds.width),
      height: round3(bounds.height),
    },
    viewBox: frameViewBox(plan, bounds),
    tierLabelX: round3(bounds.x - TIER_LABEL_GAP),
    stage: plan.stage,
    maxSeats,
  }
}
