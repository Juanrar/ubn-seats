import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { TicketCard } from '@/components/TicketCard'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import type { TicketView } from '@/lib/tickets/myTicketsView'

export interface MyTicketsProps {
  tickets: TicketView[]
  ticketCount: number
  email: string
  avatarUrl: string | null
}

export function MyTickets({ tickets, ticketCount, email, avatarUrl }: MyTicketsProps) {
  const hasTickets = tickets.length > 0

  return (
    <div className="mx-auto flex w-full max-w-[var(--layout-stack)] flex-col gap-7 px-5 py-3 sm:gap-6">
      <SiteHeader
        leading={<div role="img" aria-label="Logo de la compañía" className="brand-mark" />}
        title={TEATRO_DEL_GLOBO.name}
        email={email}
        avatarUrl={avatarUrl}
        myTickets={{ count: ticketCount, current: true }}
      />

      <section className="mx-auto flex w-full max-w-(--reading-max) flex-col gap-5 pb-8">
        <h2 className="text-hand-h1 font-bold">Mis entradas</h2>

        {hasTickets ? (
          tickets.map((ticket) => <TicketCard key={ticket.orderId} ticket={ticket} />)
        ) : (
          <div className="rounded-sm border border-rule p-5">
            <p className="text-hand-base text-ink-soft">Todavía no compraste entradas.</p>
          </div>
        )}

        <Link href="/" className="text-hand-base text-accent underline underline-offset-4">
          {hasTickets ? 'Volver a las funciones' : 'Elegir butacas'}
        </Link>
      </section>
    </div>
  )
}
