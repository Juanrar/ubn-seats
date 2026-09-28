import { LoginScreen } from '@/components/LoginScreen'
import { PerformanceList } from '@/components/PerformanceList'
import { fetchPerformancesOnSale } from '@/utils/performances'
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

  const performances = await fetchPerformancesOnSale(supabase)

  return (
    <main>
      <PerformanceList
        performances={performances}
        email={user.email ?? ''}
        avatarUrl={user.user_metadata?.avatar_url ?? null}
      />
    </main>
  )
}
