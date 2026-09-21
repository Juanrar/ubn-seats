import Link from 'next/link'
import { TicketCard } from '@/components/TicketCard'
import type { TicketView } from '@/lib/tickets/myTicketsView'

export interface MyTicketsProps {
  tickets: TicketView[]
}

export function MyTickets({ tickets }: MyTicketsProps) {
  return (
    <section className="mx-auto flex max-w-(--reading-max) flex-col gap-5 px-4 py-8">
      <h1 className="text-hand-h1 font-bold">Mis entradas</h1>

      {tickets.length === 0 ? (
        <div className="rounded-sm border border-rule p-5">
          <p className="text-hand-base text-ink-soft">Todavía no compraste entradas.</p>
          <Link href="/" className="text-hand-base text-accent underline underline-offset-4">
            Elegir butacas
          </Link>
        </div>
      ) : (
        tickets.map((ticket) => <TicketCard key={ticket.orderId} ticket={ticket} />)
      )}
    </section>
  )
}
