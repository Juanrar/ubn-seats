import type { SupabaseClient } from '@supabase/supabase-js'

const HELD_RESERVATION_STATUSES = ['pending', 'confirmed']

export interface AdminOrder {
  id: string
  status: string
  amount: number
  createdAt: string
  mpPaymentId: string | null
  ticketSentAt: string | null
  email: string | null
  seatIds: string[]
}

export async function fetchAdminOrder(
  supabase: SupabaseClient,
  orderId: string,
): Promise<AdminOrder | null> {
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, user_id, status, amount, created_at, mp_payment_id, ticket_sent_at')
    .eq('id', orderId)
    .maybeSingle()

  if (error || !order) return null

  const { data: reservations } = await supabase
    .from('reservations')
    .select('seat_id')
    .eq('order_id', orderId)
    .in('status', HELD_RESERVATION_STATUSES)

  const { data: userData } = await supabase.auth.admin.getUserById(order.user_id)

  return {
    id: order.id,
    status: order.status,
    amount: order.amount,
    createdAt: order.created_at,
    mpPaymentId: order.mp_payment_id,
    ticketSentAt: order.ticket_sent_at,
    email: userData?.user?.email ?? null,
    seatIds: (reservations ?? [])
      .map((row: { seat_id: string }) => row.seat_id)
      .sort((a: string, b: string) => a.localeCompare(b)),
  }
}
