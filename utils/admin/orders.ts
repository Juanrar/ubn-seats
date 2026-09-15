import type { SupabaseClient } from '@supabase/supabase-js'

export const ADMIN_ORDERS_LIMIT = 200

const HELD_RESERVATION_STATUSES = ['pending', 'confirmed']
const USERS_PAGE_SIZE = 1000

function seatOrder(seatId: string): [number, number] {
  const match = seatId.match(/-F(\d+)-(\d+)$/)
  if (!match) return [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]
  return [Number(match[1]), Number(match[2])]
}

function sortSeatIds(seatIds: string[]): string[] {
  return [...seatIds].sort((a, b) => {
    const [rowA, numberA] = seatOrder(a)
    const [rowB, numberB] = seatOrder(b)
    return rowA - rowB || numberA - numberB || a.localeCompare(b)
  })
}

interface OrderRow {
  id: string
  user_id: string
  status: string
  amount: number
  created_at: string
  mp_payment_id: string | null
  ticket_sent_at: string | null
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

async function fetchEmails(supabase: SupabaseClient): Promise<Map<string, string>> {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: USERS_PAGE_SIZE })
  if (error) return new Map()
  return new Map(
    data.users.flatMap(
      (user: { id: string; email?: string | null }) =>
        user.email ? [[user.id, user.email] as const] : [],
    ),
  )
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
    seatIds: sortSeatIds((reservations ?? []).map((row: { seat_id: string }) => row.seat_id)),
  }
}

export async function fetchAdminOrders(supabase: SupabaseClient): Promise<AdminOrder[]> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, user_id, status, amount, created_at, mp_payment_id, ticket_sent_at')
    .order('created_at', { ascending: false })
    .limit(ADMIN_ORDERS_LIMIT)

  if (error) throw error
  const rows = (orders as OrderRow[] | null) ?? []
  if (rows.length === 0) return []

  const { data: reservations, error: reservationsError } = await supabase
    .from('reservations')
    .select('order_id, seat_id')
    .in('order_id', rows.map((row) => row.id))
    .in('status', HELD_RESERVATION_STATUSES)

  if (reservationsError) throw reservationsError

  const seatsByOrder = new Map<string, string[]>()
  for (const { order_id, seat_id } of (reservations ?? []) as {
    order_id: string
    seat_id: string
  }[]) {
    seatsByOrder.set(order_id, [...(seatsByOrder.get(order_id) ?? []), seat_id])
  }

  const emails = await fetchEmails(supabase)

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    amount: row.amount,
    createdAt: row.created_at,
    mpPaymentId: row.mp_payment_id,
    ticketSentAt: row.ticket_sent_at,
    email: emails.get(row.user_id) ?? null,
    seatIds: sortSeatIds(seatsByOrder.get(row.id) ?? []),
  }))
}
