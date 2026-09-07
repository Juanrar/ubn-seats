import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatTotal } from '@/lib/format'
import {
  isPaymentResult,
  orderStatusCopy,
  paymentResultCopy,
  type PaymentResult,
} from '@/lib/paymentResultCopy'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'
import { fetchOrderSummary } from '@/utils/orders'
import { createClient } from '@/utils/supabase/server'

interface PageProps {
  params: Promise<{ resultado: string }>
  searchParams: Promise<{ external_reference?: string }>
}

function resultWithoutOrder(resultado: PaymentResult): PaymentResult {
  return resultado === 'exito' ? 'pendiente' : resultado
}

export default async function PagoResultadoPage({ params, searchParams }: PageProps) {
  const { resultado } = await params
  if (!isPaymentResult(resultado)) notFound()

  const { external_reference: orderId } = await searchParams
  const supabase = await createClient()
  const order = orderId ? await fetchOrderSummary(supabase, orderId) : null
  const copy = order ? orderStatusCopy(order.status) : paymentResultCopy(resultWithoutOrder(resultado))
  const venue = buildVenue(TEATRO_DEL_GLOBO)
  const seatLabels = order?.seatIds.map((seatId) => venue.byId.get(seatId)?.label ?? seatId) ?? []

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[var(--layout-stack)] flex-col items-center justify-center gap-6 px-5 text-center">
      <h1 className="text-hand-h2 font-bold">{copy.heading}</h1>
      <p className="text-hand-base text-ink-mute">{copy.description}</p>
      {order && seatLabels.length > 0 && (
        <div className="flex flex-col gap-2 text-hand-base">
          <p>{seatLabels.join(', ')}</p>
          <p className="font-mono text-hand-base">{formatTotal(order.amount)}</p>
        </div>
      )}
      <Link href="/" className="text-hand-base text-accent underline">
        Volver al mapa
      </Link>
    </main>
  )
}
