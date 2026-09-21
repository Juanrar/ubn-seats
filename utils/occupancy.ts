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

export async function fetchOwnedSeatIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('reservations')
    .select('seat_id')
    .eq('user_id', userId)
    .eq('status', 'confirmed')
  if (error) throw error
  return new Set((data as { seat_id: string }[] | null ?? []).map((row) => row.seat_id))
}
