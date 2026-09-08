import { NextRequest, NextResponse } from 'next/server'
import { WebhookSignatureValidator, InvalidWebhookSignatureError } from 'mercadopago'
import { getPayment } from '@/utils/mercadopago/client'
import { requireAccessToken, NoConnectedAccountError } from '@/utils/mercadopago/account'
import { createServiceClient } from '@/utils/supabase/service'
import { deliverTicketEmail } from '@/utils/tickets/deliver'

const CONFIRMED_STATUSES = new Set(['approved'])
const CANCELLED_STATUSES = new Set(['rejected', 'cancelled'])
const ORDER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type')
  const dataId = request.nextUrl.searchParams.get('data.id')

  if (type !== 'payment' || !dataId) {
    return NextResponse.json({ ok: true })
  }

  try {
    WebhookSignatureValidator.validate({
      xSignature: request.headers.get('x-signature'),
      xRequestId: request.headers.get('x-request-id'),
      dataId,
      secret: process.env.MP_WEBHOOK_SECRET!,
      toleranceSeconds: 300,
    })
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }
    throw error
  }

  let accessToken: string
  try {
    accessToken = await requireAccessToken()
  } catch (error) {
    if (error instanceof NoConnectedAccountError) {
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  const payment = await getPayment(dataId, accessToken)
  if (!payment.externalReference || !payment.status || !ORDER_ID_PATTERN.test(payment.externalReference)) {
    return NextResponse.json({ ok: true })
  }

  let status: 'confirmed' | 'cancelled' | null = null
  if (CONFIRMED_STATUSES.has(payment.status)) status = 'confirmed'
  else if (CANCELLED_STATUSES.has(payment.status)) status = 'cancelled'

  if (status) {
    const supabase = createServiceClient()
    const { error } = await supabase.rpc('set_order_status', {
      p_order_id: payment.externalReference,
      p_status: status,
      p_mp_payment_id: dataId,
    })

    if (error) {
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    if (status === 'confirmed') {
      try {
        await deliverTicketEmail(supabase, payment.externalReference)
      } catch {
        return NextResponse.json({ ok: true, delivered: false })
      }
    }
  }

  return NextResponse.json({ ok: true })
}
