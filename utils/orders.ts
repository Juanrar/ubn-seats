import type { SupabaseClient } from '@supabase/supabase-js'
import type { Performance } from '@/lib/performance'
import { PERFORMANCE_EMBED, toPerformance, type PerformanceRow } from '@/utils/performances'

const HELD_RESERVATION_STATUSES = ['pending', 'confirmed']

export interface OrderSummary {
  status: string
  amount: number
  performance: Performance
  seatIds: string[]
}

interface OrderRow {
  status: string
  amount: number
  performance: PerformanceRow | null
}

export async function fetchOrderSummary(supabase: SupabaseClient, orderId: string): Promise<OrderSummary | null> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`status, amount, ${PERFORMANCE_EMBED}`)
    .eq('id', orderId)
    .maybeSingle()

  if (orderError || !order) return null
  const { status, amount, performance } = order as unknown as OrderRow
  if (!performance) return null

  const { data: reservations, error: reservationsError } = await supabase
    .from('reservations')
    .select('seat_id')
    .eq('order_id', orderId)
    .in('status', HELD_RESERVATION_STATUSES)

  if (reservationsError) return null

  return {
    status,
    amount,
    performance: toPerformance(performance),
    seatIds: (reservations ?? []).map((row: { seat_id: string }) => row.seat_id),
  }
}
