import type { SupabaseClient } from '@supabase/supabase-js'

const HELD_RESERVATION_STATUSES = ['pending', 'confirmed']

function seatOrder(seatId: string): [number, number] {
  const match = seatId.match(/-F(\d+)-(\d+)$/)
  if (!match) return [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]
  return [Number(match[1]), Number(match[2])]
}

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

  const { data: reservations, error: reservationsError } = await supabase
    .from('reservations')
    .select('seat_id')
    .eq('order_id', orderId)
    .in('status', HELD_RESERVATION_STATUSES)

  if (reservationsError) return null

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
      .sort((a: string, b: string) => {
        const [rowA, numberA] = seatOrder(a)
        const [rowB, numberB] = seatOrder(b)
        return rowA - rowB || numberA - numberB || a.localeCompare(b)
      }),
  }
}
