import { redirect } from 'next/navigation'
import { MyTickets } from '@/components/MyTickets'
import { buildMyTicketsView } from '@/lib/tickets/myTicketsView'
import { buildVenue } from '@/lib/venue'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { fetchMyOrders } from '@/utils/tickets/myOrders'
import { createClient } from '@/utils/supabase/server'

const VENUE = buildVenue(TEATRO_DEL_GLOBO)

export default async function MisEntradas() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const orders = await fetchMyOrders(supabase)

  return (
    <main>
      <MyTickets tickets={buildMyTicketsView(orders, VENUE)} />
    </main>
  )
}
