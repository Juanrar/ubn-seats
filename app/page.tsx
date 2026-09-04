import { LoginScreen } from '@/components/LoginScreen'
import { PlateaPicker } from '@/components/PlateaPicker'
import { fetchOccupiedSeatIds } from '@/utils/occupancy'
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

  const occupied = await fetchOccupiedSeatIds(supabase)

  return (
    <main>
      <PlateaPicker occupied={occupied} />
    </main>
  )
}
