import type { SupabaseClient } from '@supabase/supabase-js'
import type { SeatOccupancy } from '@/lib/admin/seatState'

interface SeatRow {
  seat_id: string
  status: SeatOccupancy['status']
  order_id: string | null
}

export async function fetchAdminSeatMap(
  supabase: SupabaseClient,
): Promise<Map<string, SeatOccupancy>> {
  const { data, error } = await supabase.rpc('active_reservation_seats')
  if (error) throw error

  const rows = (data as SeatRow[] | null) ?? []
  return new Map(
    rows.map((row) => [row.seat_id, { status: row.status, orderId: row.order_id }]),
  )
}
