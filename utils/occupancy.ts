import type { SupabaseClient } from '@supabase/supabase-js'

interface ActiveReservationRow {
  seat_id: string
  status: string
}

export async function fetchOccupiedSeatIds(supabase: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await supabase.rpc('active_reservation_seats')
  if (error) throw error
  return new Set((data as ActiveReservationRow[] | null ?? []).map((row) => row.seat_id))
}
