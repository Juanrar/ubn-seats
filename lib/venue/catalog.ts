import { boundingBox, placeAtOffset, type Box } from '@/lib/geometry'
import type { RowPlan, Seat, SectorId, VenuePlan } from '@/lib/types'
import { seatLabel } from '@/lib/venue/labels'
import { centerRowNumbers, wingNumber } from '@/lib/venue/numbering'
import { tierFor } from '@/lib/venue/pricing'

export const round3 = (n: number): number => Math.round(n * 1000) / 1000 + 0

const pad2 = (n: number) => String(n).padStart(2, '0')

function seatId(sector: SectorId, row: number, number: number): string {
  return `${sector}-F${pad2(row)}-${number}`
}

function halfWidth(rowPlan: RowPlan): number {
  return rowPlan.center > 0 ? (rowPlan.center - 1) / 2 : 0
}

function makeSeat(
  plan: VenuePlan,
  sector: SectorId,
  row: number,
  number: number,
  offset: number,
): Seat {
  const { x, y, angle } = placeAtOffset(plan.geometry, row, offset)
  const tier = tierFor(plan, sector, row)
  return {
    id: seatId(sector, row, number),
    sector,
    row,
    number,
    price: tier.price,
    tier: tier.label,
    label: seatLabel(row, number, tier.label),
    x: round3(x),
    y: round3(y),
    angle: round3(angle),
  }
}

export function buildSeats(plan: VenuePlan): Seat[] {
  const { wingInnerOffset } = plan.geometry
  const { leftSector, rightSector, leftStartNumber, rightStartNumber } = plan.wings
  const seats: Seat[] = []

  for (const rowPlan of plan.rows) {
    const { row } = rowPlan
    const h = halfWidth(rowPlan)

    centerRowNumbers(rowPlan.center).forEach((number, k) => {
      seats.push(makeSeat(plan, plan.centerBlock.sector, row, number, k - h))
    })

    for (let j = 0; j < rowPlan.wing; j++) {
      const offset = wingInnerOffset + j
      seats.push(makeSeat(plan, leftSector, row, wingNumber(leftStartNumber, j), -offset))
      seats.push(makeSeat(plan, rightSector, row, wingNumber(rightStartNumber, j), offset))
    }
  }

  return seats
}

export function seatBounds(plan: VenuePlan, seats: Seat[]): Box {
  const { seatWidth, seatHeight } = plan.geometry
  return boundingBox(seats, Math.hypot(seatWidth, seatHeight) / 2)
}
