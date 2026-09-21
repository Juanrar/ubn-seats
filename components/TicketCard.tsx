'use client'

import { useEffect, useRef, useState } from 'react'
import { SHOW } from '@/lib/show'
import { resendTicket } from '@/app/mis-entradas/actions'
import type { TicketView } from '@/lib/tickets/myTicketsView'

const RESEND_COOLDOWN_MS = 60000

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: 'America/Argentina/Buenos_Aires',
})

export interface TicketCardProps {
  ticket: TicketView
}

export function TicketCard({ ticket }: TicketCardProps) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState('')
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  async function handleResend() {
    setSending(true)
    setMessage('')
    const result = await resendTicket(ticket.orderId)
    setSending(false)

    if (result.ok) {
      setSent(true)
      setMessage('Listo, te lo enviamos por mail.')
      resetTimeoutRef.current = setTimeout(() => setSent(false), RESEND_COOLDOWN_MS)
      return
    }

    setMessage(result.message)
  }

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
      <p className="text-hand-sm text-ink-soft">{dateFormatter.format(new Date(SHOW.startsAt))}</p>

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
        <span className="font-mono text-hand-xs text-accent">{ticket.total}</span>
        <div className="flex flex-wrap items-baseline gap-4">
          <a
            href={`/api/entradas/${ticket.orderId}`}
            className="rounded-sm border border-accent px-3 text-hand-sm text-accent hover:bg-accent hover:text-paper"
          >
            Descargar entradas
          </a>
          <button
            type="button"
            onClick={handleResend}
            disabled={sending || sent}
            className="text-hand-sm text-ink-soft underline underline-offset-4 hover:text-accent disabled:no-underline disabled:opacity-60"
          >
            {sending ? 'Enviando…' : sent ? 'Enviado' : 'Reenviar al mail'}
          </button>
        </div>
      </div>

      <p aria-live="polite" className="mt-2 text-hand-sm text-ink-mute">
        {message}
      </p>
    </article>
  )
}
