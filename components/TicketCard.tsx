import { SHOW } from '@/lib/show'
import type { TicketView } from '@/lib/tickets/myTicketsView'

export interface TicketCardProps {
  ticket: TicketView
}

export function TicketCard({ ticket }: TicketCardProps) {
  const seatCount = ticket.seats.length

  return (
    <article
      aria-label={`${SHOW.title}, ${seatCount} ${seatCount === 1 ? 'butaca' : 'butacas'}`}
      className="rounded-sm border border-accent bg-paper-2 p-5"
    >
      <p className="text-hand-h2 font-semibold">{SHOW.title}</p>
      <p className="text-hand-sm text-ink-soft">
        {SHOW.venue} — {SHOW.address}
      </p>
      <p className="text-hand-sm text-ink-soft">{ticket.date}</p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {ticket.seats.map((seat) => (
          <li
            key={seat.id}
            className="rounded-sm border border-rule bg-paper px-2 text-hand-sm text-ink"
          >
            {seat.label}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3 border-t border-rule pt-3">
        <span className="font-mono text-hand-base text-accent">{ticket.total}</span>
        <a
          href={`/api/entradas/${ticket.orderId}`}
          className="rounded-sm border border-accent px-3 text-hand-sm text-accent hover:bg-accent hover:text-paper"
        >
          Descargar entradas
        </a>
      </div>
    </article>
  )
}
