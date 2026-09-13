export type AdminSeatStatus = 'free' | 'selected' | 'blocked' | 'sold' | 'pending'

export type SelectionAction = 'none' | 'block' | 'unblock' | 'mixed'

export interface SeatOccupancy {
  status: 'pending' | 'confirmed' | 'blocked'
  orderId: string | null
}

export function isSelectable(seatId: string, occupancy: Map<string, SeatOccupancy>): boolean {
  const row = occupancy.get(seatId)
  return !row || row.status === 'blocked'
}

export function orderIdAt(
  seatId: string,
  occupancy: Map<string, SeatOccupancy>,
): string | null {
  const row = occupancy.get(seatId)
  if (!row || row.status === 'blocked') return null
  return row.orderId
}

export function adminSeatStatus(
  seatId: string,
  occupancy: Map<string, SeatOccupancy>,
  selectedIds: Set<string>,
): AdminSeatStatus {
  const row = occupancy.get(seatId)
  if (row?.status === 'confirmed') return 'sold'
  if (row?.status === 'pending') return 'pending'
  if (selectedIds.has(seatId)) return 'selected'
  return row?.status === 'blocked' ? 'blocked' : 'free'
}

export function selectionAction(
  selectedIds: Set<string>,
  occupancy: Map<string, SeatOccupancy>,
): SelectionAction {
  if (selectedIds.size === 0) return 'none'

  let free = 0
  let blocked = 0
  for (const id of selectedIds) {
    if (occupancy.get(id)?.status === 'blocked') blocked += 1
    else free += 1
  }

  if (free > 0 && blocked > 0) return 'mixed'
  return blocked > 0 ? 'unblock' : 'block'
}
