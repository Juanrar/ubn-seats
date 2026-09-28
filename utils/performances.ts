import type { SupabaseClient } from '@supabase/supabase-js'
import { isPerformanceId, type Performance } from '@/lib/performance'

interface PerformanceRow {
  id: string
  starts_at: string
}

const COLUMNS = 'id, starts_at'

function toPerformance(row: PerformanceRow): Performance {
  return { id: row.id, startsAt: row.starts_at }
}

export async function fetchPerformancesOnSale(
  supabase: SupabaseClient,
  now: Date = new Date(),
): Promise<Performance[]> {
  const { data, error } = await supabase
    .from('performances')
    .select(COLUMNS)
    .gt('starts_at', now.toISOString())
    .order('starts_at', { ascending: true })
  if (error) throw error
  return ((data as PerformanceRow[] | null) ?? []).map(toPerformance)
}

export async function fetchAllPerformances(supabase: SupabaseClient): Promise<Performance[]> {
  const { data, error } = await supabase
    .from('performances')
    .select(COLUMNS)
    .order('starts_at', { ascending: true })
  if (error) throw error
  return ((data as PerformanceRow[] | null) ?? []).map(toPerformance)
}

export async function fetchPerformance(
  supabase: SupabaseClient,
  performanceId: string,
): Promise<Performance | null> {
  if (!isPerformanceId(performanceId)) return null

  const { data, error } = await supabase
    .from('performances')
    .select(COLUMNS)
    .eq('id', performanceId)
    .maybeSingle()

  if (error || !data) return null
  return toPerformance(data as PerformanceRow)
}
