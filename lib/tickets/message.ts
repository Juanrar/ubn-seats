import { SHOW } from '@/lib/show'
import { formatTotal } from '@/lib/format'
import { buildVenue } from '@/lib/venue'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import type { Seat } from '@/lib/types'

export interface TicketEmail {
  subject: string
  text: string
  html: string
}

export interface TicketEmailParams {
  seatIds: string[]
  amount: number
}

const VENUE = buildVenue(TEATRO_DEL_GLOBO)

const PAPER = '#f1e8d3'
const PAPER_2 = '#ece1c7'
const INK = '#2b2820'
const INK_SOFT = '#5a5444'
const INK_MUTE = '#6f6858'
const RULE = '#c9bfa3'
const ACCENT = '#8a6a3b'

const HAND_STACK = "'Caveat', 'Segoe Script', 'Bradley Hand', cursive"
const MONO_STACK = "'JetBrains Mono', ui-monospace, 'Courier New', monospace"

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildSubject(seats: Seat[]): string {
  return seats.length === 1
    ? `Tu entrada para ${SHOW.title}`
    : `Tus ${seats.length} entradas para ${SHOW.title}`
}

function buildText(seats: Seat[], amount: number): string {
  const single = seats.length === 1
  return [
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
}

function seatRows(seats: Seat[]): string {
  return seats
    .map(
      (seat) => `
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid ${RULE};font-family:${HAND_STACK};font-size:21px;line-height:1.35;color:${INK};">${escapeHtml(seat.label)}</td>
                <td align="right" style="padding:8px 0;border-bottom:1px solid ${RULE};font-family:${MONO_STACK};font-size:14px;color:${INK_SOFT};white-space:nowrap;">${escapeHtml(formatTotal(seat.price))}</td>
              </tr>`,
    )
    .join('')
}

function buildHtml(seats: Seat[], amount: number): string {
  const single = seats.length === 1

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(buildSubject(seats))}</title>
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:${PAPER_2};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${PAPER_2};padding:24px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:${PAPER};border:1px solid ${RULE};border-radius:4px;">
        <tr>
          <td style="padding:28px 28px 0 28px;">
            <p style="margin:0;font-family:${HAND_STACK};font-size:32px;line-height:1;color:${INK};">${single ? '¡Listo! Tu entrada ya está confirmada.' : '¡Listo! Tus entradas ya están confirmadas.'}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px 0 28px;">
            <p style="margin:0;font-family:${HAND_STACK};font-size:24px;line-height:1.2;color:${INK};">${escapeHtml(SHOW.title)}</p>
            <p style="margin:4px 0 0 0;font-family:${HAND_STACK};font-size:19px;line-height:1.3;color:${INK_SOFT};">${escapeHtml(SHOW.venue)} — ${escapeHtml(SHOW.address)}</p>
            <p style="margin:2px 0 0 0;font-family:${HAND_STACK};font-size:19px;line-height:1.3;color:${INK_SOFT};">${escapeHtml(showDate())}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px 0 28px;">
            <p style="margin:0 0 4px 0;font-family:${HAND_STACK};font-size:19px;line-height:1.3;color:${INK_MUTE};">${single ? 'Tu butaca' : 'Tus butacas'}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${RULE};">${seatRows(seats)}
              <tr>
                <td style="padding:12px 0 0 0;font-family:${HAND_STACK};font-size:21px;line-height:1.35;color:${INK};">Total pagado</td>
                <td align="right" style="padding:12px 0 0 0;font-family:${MONO_STACK};font-size:17px;font-weight:500;color:${ACCENT};white-space:nowrap;">${escapeHtml(formatTotal(amount))}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px 28px 28px;">
            <p style="margin:0;font-family:${HAND_STACK};font-size:19px;line-height:1.3;color:${INK_SOFT};">${escapeHtml(SHOW.doorsNote)}</p>
            <p style="margin:6px 0 0 0;font-family:${HAND_STACK};font-size:19px;line-height:1.3;color:${INK_SOFT};">${single ? 'Mostrá la entrada adjunta en la puerta, impresa o desde el celular.' : 'Mostrá las entradas adjuntas en la puerta, impresas o desde el celular.'}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

export function buildTicketEmail({ seatIds, amount }: TicketEmailParams): TicketEmail {
  const seats = resolveSeats(seatIds)

  return {
    subject: buildSubject(seats),
    text: buildText(seats, amount),
    html: buildHtml(seats, amount),
  }
}
