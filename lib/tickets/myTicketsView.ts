import { formatTotal } from '@/lib/format'
import { formatPerformanceDate, type Performance } from '@/lib/performance'
import type { Venue } from '@/lib/venue'
import type { Seat } from '@/lib/types'

export interface MyOrder {
  orderId: string
  amount: number
  seatIds: string[]
  createdAt: string
  performance: Performance
}

export interface TicketSeatView {
  id: string
  label: string
}

export interface TicketView {
  orderId: string
  seats: TicketSeatView[]
  total: string
  date: string
}

function seatOrder(venue: Venue, seatId: string): [number, number] {
  const seat: Seat | undefined = venue.byId.get(seatId)
  return seat ? [seat.row, seat.number] : [Number.MAX_SAFE_INTEGER, 0]
}

function toSeatView(venue: Venue, seatId: string): TicketSeatView {
  const seat = venue.byId.get(seatId)
  return { id: seatId, label: seat?.label ?? seatId }
}

function byPerformanceThenNewest(a: MyOrder, b: MyOrder): number {
  return (
    Date.parse(a.performance.startsAt) - Date.parse(b.performance.startsAt) ||
    Date.parse(b.createdAt) - Date.parse(a.createdAt)
  )
}

export function countTickets(orders: MyOrder[]): number {
  return orders.reduce((count, order) => count + order.seatIds.length, 0)
}

export function buildMyTicketsView(orders: MyOrder[], venue: Venue): TicketView[] {
  return [...orders].sort(byPerformanceThenNewest).map((order) => ({
    orderId: order.orderId,
    seats: [...order.seatIds]
      .sort((a, b) => {
        const [rowA, numberA] = seatOrder(venue, a)
        const [rowB, numberB] = seatOrder(venue, b)
        return rowA - rowB || numberA - numberB || a.localeCompare(b)
      })
      .map((seatId) => toSeatView(venue, seatId)),
    total: formatTotal(order.amount),
    date: formatPerformanceDate(order.performance.startsAt),
  }))
}
