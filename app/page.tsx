import { LoginScreen } from '@/components/LoginScreen'
import { PerformanceList } from '@/components/PerformanceList'
import { countTickets } from '@/lib/tickets/myTicketsView'
import { fetchPerformancesOnSale } from '@/utils/performances'
import { createClient } from '@/utils/supabase/server'
import { fetchMyOrders } from '@/utils/tickets/myOrders'

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

  const [performances, orders] = await Promise.all([
    fetchPerformancesOnSale(supabase),
    fetchMyOrders(supabase),
  ])

  return (
    <main>
      <PerformanceList
        performances={performances}
        ticketCount={countTickets(orders)}
        email={user.email ?? ''}
        avatarUrl={user.user_metadata?.avatar_url ?? null}
      />
    </main>
  )
}
