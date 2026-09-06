import type { SupabaseClient } from '@supabase/supabase-js'

export interface OrderSummary {
  status: string
  amount: number
  seatIds: string[]
}

export async function fetchOrderSummary(supabase: SupabaseClient, orderId: string): Promise<OrderSummary | null> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('status, amount')
    .eq('id', orderId)
    .maybeSingle()

  if (orderError || !order) return null

  const { data: reservations, error: reservationsError } = await supabase
    .from('reservations')
    .select('seat_id')
    .eq('order_id', orderId)

  if (reservationsError) return null

  return {
    status: order.status,
    amount: order.amount,
    seatIds: (reservations ?? []).map((row: { seat_id: string }) => row.seat_id),
  }
}
