import type { SupabaseClient } from '@supabase/supabase-js'
import { buildTicketEmail } from '@/lib/tickets/message'
import { sendTicketEmail } from '@/utils/email/client'
import { readTicketAttachment } from '@/utils/tickets/attachment'
import { fetchOrderSummary } from '@/utils/orders'

async function buyerEmail(supabase: SupabaseClient, orderId: string): Promise<string> {
  const { data: order, error } = await supabase
    .from('orders')
    .select('user_id')
    .eq('id', orderId)
    .maybeSingle()

  if (error || !order) {
    throw new Error(`No se encontró la orden ${orderId}`)
  }

  const { data, error: userError } = await supabase.auth.admin.getUserById(order.user_id)

  if (userError || !data.user?.email) {
    throw new Error(`La orden ${orderId} no tiene un mail al que enviar la entrada`)
  }

  return data.user.email
}

export async function deliverTicketEmail(supabase: SupabaseClient, orderId: string): Promise<void> {
  const { data: claimed, error: claimError } = await supabase.rpc('claim_ticket_delivery', {
    p_order_id: orderId,
  })

  if (claimError || !claimed) return

  try {
    const summary = await fetchOrderSummary(supabase, orderId)
    if (!summary) {
      throw new Error(`No se pudo leer el resumen de la orden ${orderId}`)
    }

    const [to, attachment] = await Promise.all([buyerEmail(supabase, orderId), readTicketAttachment()])
    const { subject, text } = buildTicketEmail({ seatIds: summary.seatIds, amount: summary.amount })

    await sendTicketEmail({ to, subject, text, attachments: [attachment] })
  } catch (error) {
    await supabase.rpc('release_ticket_delivery', { p_order_id: orderId })
    throw error
  }
}
