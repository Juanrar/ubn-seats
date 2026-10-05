import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { EmailAttachment } from '@/utils/email/client'
import { performanceDateKey, type Performance } from '@/lib/performance'
import { resolveTicketSeats } from '@/lib/tickets/seats'
import { renderTicketPdf } from '@/utils/tickets/ticketPdf'

const ASSETS_DIR = join(process.cwd(), 'assets')
const FONT_PATH = join(ASSETS_DIR, 'fonts', 'Barlow-SemiBold.ttf')

function backgroundPath(dateKey: string): string {
  return join(ASSETS_DIR, 'tickets', `${dateKey}.jpg`)
}

export async function buildTicketAttachment(
  performance: Performance,
  seatIds: string[],
): Promise<EmailAttachment> {
  const seats = resolveTicketSeats(seatIds)
  if (seats.length === 0) {
    throw new Error('La orden no tiene butacas del plano para armar la entrada')
  }

  const dateKey = performanceDateKey(performance.startsAt)
  const [background, font] = await Promise.all([readFile(backgroundPath(dateKey)), readFile(FONT_PATH)])
  const pdf = await renderTicketPdf({ background, font, seats })

  return { name: `entradas-ubn-${dateKey}.pdf`, contentBase64: Buffer.from(pdf).toString('base64') }
}
