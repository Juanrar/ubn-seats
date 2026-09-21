import { formatTotal } from '@/lib/format'
import type { Venue } from '@/lib/venue'
import type { Seat } from '@/lib/types'

export interface MyOrder {
  orderId: string
  amount: number
  seatIds: string[]
  createdAt: string
}

export interface TicketSeatView {
  id: string
  label: string
}

export interface TicketView {
  orderId: string
  seats: TicketSeatView[]
  total: string
}

function seatOrder(venue: Venue, seatId: string): [number, number] {
  const seat: Seat | undefined = venue.byId.get(seatId)
  return seat ? [seat.row, seat.number] : [Number.MAX_SAFE_INTEGER, 0]
}

function toSeatView(venue: Venue, seatId: string): TicketSeatView {
  const seat = venue.byId.get(seatId)
  return { id: seatId, label: seat?.label ?? seatId }
}

export function buildMyTicketsView(orders: MyOrder[], venue: Venue): TicketView[] {
  return orders.map((order) => ({
    orderId: order.orderId,
    seats: [...order.seatIds]
      .sort((a, b) => {
        const [rowA, numberA] = seatOrder(venue, a)
        const [rowB, numberB] = seatOrder(venue, b)
        return rowA - rowB || numberA - numberB || a.localeCompare(b)
      })
      .map((seatId) => toSeatView(venue, seatId)),
    total: formatTotal(order.amount),
  }))
}
