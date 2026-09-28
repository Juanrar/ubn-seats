import { formatPerformanceDate, type Performance } from '@/lib/performance'
import type { Seat } from '@/lib/types'

export interface OrderItem {
  id: string
  title: string
  quantity: number
  unit_price: number
  currency_id: 'ARS'
}

export interface OrderSummary {
  items: OrderItem[]
  amount: number
}

export function buildOrderItems(seats: Seat[], performance: Performance): OrderSummary {
  const date = formatPerformanceDate(performance.startsAt)
  const items = seats.map((seat) => ({
    id: seat.id,
    title: `${seat.label} · ${date}`,
    quantity: 1,
    unit_price: seat.price,
    currency_id: 'ARS' as const,
  }))
  const amount = seats.reduce((sum, seat) => sum + seat.price, 0)
  return { items, amount }
}
