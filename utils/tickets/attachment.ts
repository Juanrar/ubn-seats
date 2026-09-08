import { readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import type { EmailAttachment } from '@/utils/email/client'

const DEFAULT_TICKET_IMAGE_PATH = join('public', 'tickets', 'entrada.png')

function ticketImagePath(): string {
  return process.env.TICKET_IMAGE_PATH || join(process.cwd(), DEFAULT_TICKET_IMAGE_PATH)
}

export async function readTicketAttachment(): Promise<EmailAttachment> {
  const path = ticketImagePath()
  const content = await readFile(path)
  return { name: basename(path), contentBase64: content.toString('base64') }
}
