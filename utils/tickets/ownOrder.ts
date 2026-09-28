import type { SupabaseClient } from '@supabase/supabase-js'
import type { Performance } from '@/lib/performance'
import { PERFORMANCE_EMBED, toPerformance, type PerformanceRow } from '@/utils/performances'

export interface OwnOrder {
  orderId: string
  amount: number
  performance: Performance
  seatIds: string[]
}

interface OrderRow {
  id: string
  amount: number
  performance: PerformanceRow | null
}

export async function fetchOwnPaidOrder(
  supabase: SupabaseClient,
  orderId: string,
): Promise<OwnOrder | null> {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`id, amount, ${PERFORMANCE_EMBED}`)
    .eq('id', orderId)
    .eq('status', 'confirmed')
    .maybeSingle()

  if (error || !order) return null
  const { id, amount, performance } = order as unknown as OrderRow
  if (!performance) return null

  const { data: reservations, error: reservationsError } = await supabase
    .from('reservations')
    .select('seat_id')
    .eq('order_id', orderId)
    .eq('status', 'confirmed')

  if (reservationsError || !reservations || reservations.length === 0) return null

  return {
    orderId: id,
    amount,
    performance: toPerformance(performance),
    seatIds: (reservations as { seat_id: string }[]).map((row) => row.seat_id),
  }
}
