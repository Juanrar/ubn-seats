import { SHOW } from '@/lib/show'
import { formatTotal } from '@/lib/format'
import { buildVenue } from '@/lib/venue'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import type { Seat } from '@/lib/types'

export interface TicketEmail {
  subject: string
  text: string
}

export interface TicketEmailParams {
  seatIds: string[]
  amount: number
}

const VENUE = buildVenue(TEATRO_DEL_GLOBO)

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: 'America/Argentina/Buenos_Aires',
})

function resolveSeats(seatIds: string[]): Seat[] {
  return seatIds
    .map((seatId) => VENUE.byId.get(seatId))
    .filter((seat): seat is Seat => seat !== undefined)
    .sort((a, b) => a.row - b.row || a.number - b.number)
}

function showDate(): string {
  return dateFormatter.format(new Date(SHOW.startsAt))
}

export function buildTicketEmail({ seatIds, amount }: TicketEmailParams): TicketEmail {
  const seats = resolveSeats(seatIds)
  const single = seats.length === 1
  const subject = single
    ? `Tu entrada para ${SHOW.title}`
    : `Tus ${seats.length} entradas para ${SHOW.title}`

  const text = [
    single ? '¡Listo! Tu entrada ya está confirmada.' : '¡Listo! Tus entradas ya están confirmadas.',
    '',
    SHOW.title,
    `${SHOW.venue} — ${SHOW.address}`,
    showDate(),
    '',
    single ? 'Tu butaca:' : 'Tus butacas:',
    ...seats.map((seat) => `  ${seat.label}`),
    '',
    `Total pagado: ${formatTotal(amount)}`,
    '',
    SHOW.doorsNote,
    single
      ? 'Mostrá la entrada adjunta en la puerta, impresa o desde el celular.'
      : 'Mostrá las entradas adjuntas en la puerta, impresas o desde el celular.',
  ].join('\n')

  return { subject, text }
}
