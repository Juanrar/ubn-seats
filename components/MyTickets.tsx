import Link from 'next/link'
import { TicketCard } from '@/components/TicketCard'
import type { TicketView } from '@/lib/tickets/myTicketsView'

export interface MyTicketsProps {
  tickets: TicketView[]
}

export function MyTickets({ tickets }: MyTicketsProps) {
  const hasTickets = tickets.length > 0

  return (
    <section className="mx-auto flex max-w-(--reading-max) flex-col gap-5 px-4 py-8">
      <h1 className="text-hand-h1 font-bold">Mis entradas</h1>

      {hasTickets ? (
        tickets.map((ticket) => <TicketCard key={ticket.orderId} ticket={ticket} />)
      ) : (
        <div className="rounded-sm border border-rule p-5">
          <p className="text-hand-base text-ink-soft">Todavía no compraste entradas.</p>
        </div>
      )}

      <Link href="/" className="text-hand-base text-accent underline underline-offset-4">
        {hasTickets ? 'Volver al mapa' : 'Elegir butacas'}
      </Link>
    </section>
  )
}
