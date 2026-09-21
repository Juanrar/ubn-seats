import { createClient } from '@/utils/supabase/server'
import { fetchOwnPaidOrder } from '@/utils/tickets/ownOrder'
import { readTicketAttachment } from '@/utils/tickets/attachment'
import { ticketContentType } from '@/utils/tickets/contentType'

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return new Response('Iniciá sesión', { status: 401 })

  const order = await fetchOwnPaidOrder(supabase, orderId)
  if (!order) return new Response('No encontrada', { status: 404 })

  try {
    const attachment = await readTicketAttachment()
    return new Response(Buffer.from(attachment.contentBase64, 'base64'), {
      headers: {
        'content-type': ticketContentType(attachment.name),
        'content-disposition': `attachment; filename="${attachment.name}"`,
        'cache-control': 'no-store',
      },
    })
  } catch {
    return new Response('No encontrada', { status: 404 })
  }
}
