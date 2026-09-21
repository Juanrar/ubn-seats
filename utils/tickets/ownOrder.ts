import type { SupabaseClient } from '@supabase/supabase-js'

export interface OwnOrder {
  orderId: string
  amount: number
  seatIds: string[]
}

export async function fetchOwnPaidOrder(
  supabase: SupabaseClient,
  orderId: string,
): Promise<OwnOrder | null> {
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, amount')
    .eq('id', orderId)
    .eq('status', 'confirmed')
    .maybeSingle()

  if (error || !order) return null

  const { data: reservations, error: reservationsError } = await supabase
    .from('reservations')
    .select('seat_id')
    .eq('order_id', orderId)
    .eq('status', 'confirmed')

  if (reservationsError || !reservations || reservations.length === 0) return null

  return {
    orderId: order.id,
    amount: order.amount,
    seatIds: (reservations as { seat_id: string }[]).map((row) => row.seat_id),
  }
}
