import { LoginScreen } from '@/components/LoginScreen'
import { PlateaPicker } from '@/components/PlateaPicker'
import { fetchOccupiedSeatIds, fetchOwnedSeatIds } from '@/utils/occupancy'
import { createClient } from '@/utils/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main>
        <LoginScreen />
      </main>
    )
  }

  const [occupied, owned] = await Promise.all([
    fetchOccupiedSeatIds(supabase),
    fetchOwnedSeatIds(supabase, user.id),
  ])

  return (
    <main>
      <PlateaPicker
        occupied={occupied}
        owned={owned}
        email={user.email ?? ''}
        avatarUrl={user.user_metadata?.avatar_url ?? null}
      />
    </main>
  )
}
