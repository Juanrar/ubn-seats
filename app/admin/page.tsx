import { getConnectedAccount } from '@/utils/mercadopago/account'
import { ConnectionCard } from '@/components/admin/ConnectionCard'
import { AdminSeatMap } from '@/components/admin/AdminSeatMap'
import { signOut } from '@/app/admin/actions'
import type { SeatOccupancy } from '@/lib/admin/seatState'
import { fetchAdminSeatMap } from '@/utils/admin/seats'
import { createServiceClient } from '@/utils/supabase/service'

export const dynamic = 'force-dynamic'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const account = await getConnectedAccount()

  let occupancy: Map<string, SeatOccupancy> | null = null
  try {
    occupancy = await fetchAdminSeatMap(createServiceClient())
  } catch {
    occupancy = null
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex items-baseline justify-between">
        <h1 className="text-hand-h1 font-bold">Panel</h1>
        <form action={signOut}>
          <button type="submit" className="text-hand-sm font-medium text-ink-mute underline">
            Salir
          </button>
        </form>
      </header>

      <ConnectionCard
        account={
          account ? { mpUserId: account.mpUserId, connectedAt: account.connectedAt } : null
        }
        error={error ?? null}
      />

      {occupancy ? (
        <AdminSeatMap occupancy={occupancy} />
      ) : (
        <section className="flex flex-col gap-2 border-t border-rule pt-4">
          <h2 className="text-hand-h2 font-bold">Butacas</h2>
          <p role="alert" className="text-hand-base text-ink-mute">
            No se pudo cargar el mapa de butacas. Recargá la página.
          </p>
        </section>
      )}
    </main>
  )
}
