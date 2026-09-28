import type { SupabaseClient } from '@supabase/supabase-js'
import type { MyOrder } from '@/lib/tickets/myTicketsView'
import { PERFORMANCE_EMBED, toPerformance, type PerformanceRow } from '@/utils/performances'

interface OrderRow {
  id: string
  amount: number
  created_at: string
  performance: PerformanceRow | null
}

interface ReservationRow {
  order_id: string
  seat_id: string
}

export async function fetchMyOrders(supabase: SupabaseClient): Promise<MyOrder[]> {
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`id, amount, created_at, ${PERFORMANCE_EMBED}`)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })

  if (ordersError || !orders || orders.length === 0) return []

  const orderIds = (orders as unknown as OrderRow[]).map((order) => order.id)

  const { data: reservations, error: reservationsError } = await supabase
    .from('reservations')
    .select('order_id, seat_id')
    .in('order_id', orderIds)
    .eq('status', 'confirmed')

  if (reservationsError || !reservations) return []

  const seatsByOrder = new Map<string, string[]>()
  for (const row of reservations as ReservationRow[]) {
    const current = seatsByOrder.get(row.order_id)
    if (current) current.push(row.seat_id)
    else seatsByOrder.set(row.order_id, [row.seat_id])
  }

  return (orders as unknown as OrderRow[]).flatMap((order) =>
    order.performance && seatsByOrder.has(order.id)
      ? [
          {
            orderId: order.id,
            amount: order.amount,
            seatIds: seatsByOrder.get(order.id)!,
            createdAt: order.created_at,
            performance: toPerformance(order.performance),
          },
        ]
      : [],
  )
}
