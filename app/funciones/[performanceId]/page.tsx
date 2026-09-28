import { redirect } from 'next/navigation'
import { PlateaPicker } from '@/components/PlateaPicker'
import { isOnSale } from '@/lib/performance'
import { fetchOccupiedSeatIds, fetchOwnedSeatIds } from '@/utils/occupancy'
import { fetchPerformance } from '@/utils/performances'
import { createClient } from '@/utils/supabase/server'

interface PageProps {
  params: Promise<{ performanceId: string }>
}

const PERFORMANCES_PATH = '/'

export default async function PerformancePage({ params }: PageProps) {
  const { performanceId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(PERFORMANCES_PATH)

  const performance = await fetchPerformance(supabase, performanceId)
  if (!performance || !isOnSale(performance, Date.now())) redirect(PERFORMANCES_PATH)

  const [occupied, owned] = await Promise.all([
    fetchOccupiedSeatIds(supabase, performance.id),
    fetchOwnedSeatIds(supabase, user.id, performance.id),
  ])

  return (
    <main>
      <PlateaPicker
        performance={performance}
        occupied={occupied}
        owned={owned}
        email={user.email ?? ''}
        avatarUrl={user.user_metadata?.avatar_url ?? null}
      />
    </main>
  )
}
