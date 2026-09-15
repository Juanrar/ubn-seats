import Link from 'next/link'
import { AdminSeatMap } from '@/components/admin/AdminSeatMap'
import { SeatSummaryBar } from '@/components/admin/SeatSummaryBar'
import { summarizeSeats, type SeatOccupancy } from '@/lib/admin/seatState'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'
import { fetchAdminSeatMap } from '@/utils/admin/seats'
import { getConnectedAccount, type StoredAccount } from '@/utils/mercadopago/account'
import { createServiceClient } from '@/utils/supabase/service'

export const dynamic = 'force-dynamic'

export default async function SeatsPage() {
  let account: StoredAccount | null = null
  let accountUnknown = false
  try {
    account = await getConnectedAccount()
  } catch {
    accountUnknown = true
  }
  const venue = buildVenue(TEATRO_DEL_GLOBO)

  let occupancy: Map<string, SeatOccupancy> | null = null
  try {
    occupancy = await fetchAdminSeatMap(createServiceClient())
  } catch {
    occupancy = null
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-6">
      <h1 className="text-hand-h1 font-bold">Butacas</h1>

      {!accountUnknown && !account && (
        <p role="alert" className="rounded-md border border-ink px-3 py-2 text-hand-sm text-ink">
          La venta está deshabilitada: falta vincular Mercado Pago.{' '}
          <Link href="/admin/cuenta" className="font-bold underline">
            Ir a Cuenta
          </Link>
        </p>
      )}

      {occupancy ? (
        <>
          <SeatSummaryBar summary={summarizeSeats(venue.seats.map((seat) => seat.id), occupancy)} />
          <AdminSeatMap occupancy={occupancy} />
        </>
      ) : (
        <p role="alert" className="text-hand-base text-ink-mute">
          No se pudo cargar el mapa de butacas. Recargá la página.
        </p>
      )}
    </main>
  )
}
