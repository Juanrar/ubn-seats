import { AdminSeatMap } from '@/components/admin/AdminSeatMap'
import type { SeatOccupancy } from '@/lib/admin/seatState'
import { fetchAdminSeatMap } from '@/utils/admin/seats'
import { createServiceClient } from '@/utils/supabase/service'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  let occupancy: Map<string, SeatOccupancy> | null = null
  try {
    occupancy = await fetchAdminSeatMap(createServiceClient())
  } catch {
    occupancy = null
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-6">
      <h1 className="text-hand-h1 font-bold">Butacas</h1>

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
