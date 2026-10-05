import { buildVenue } from '@/lib/venue'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import type { Seat } from '@/lib/types'

const VENUE = buildVenue(TEATRO_DEL_GLOBO)

export function resolveTicketSeats(seatIds: string[]): Seat[] {
  return seatIds
    .map((seatId) => VENUE.byId.get(seatId))
    .filter((seat): seat is Seat => seat !== undefined)
    .sort((a, b) => a.row - b.row || a.number - b.number)
}
