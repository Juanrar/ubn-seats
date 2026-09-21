'use server'

import { createClient } from '@/utils/supabase/server'
import { fetchOwnPaidOrder } from '@/utils/tickets/ownOrder'
import { buildTicketEmail } from '@/lib/tickets/message'
import { sendTicketEmail } from '@/utils/email/client'
import { readTicketAttachment } from '@/utils/tickets/attachment'

export type ResendResult = { ok: true } | { ok: false; message: string }

export async function resendTicket(orderId: string): Promise<ResendResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { ok: false, message: 'Iniciá sesión para ver tus entradas.' }
  }

  const order = await fetchOwnPaidOrder(supabase, orderId)
  if (!order) {
    return { ok: false, message: 'No encontramos esa entrada.' }
  }

  try {
    const attachment = await readTicketAttachment()
    const { subject, text, html } = buildTicketEmail({
      seatIds: order.seatIds,
      amount: order.amount,
    })

    await sendTicketEmail({ to: user.email, subject, text, html, attachments: [attachment] })
    return { ok: true }
  } catch {
    return { ok: false, message: 'No pudimos enviar el mail. Probá de nuevo en un rato.' }
  }
}
