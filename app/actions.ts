'use server'

import { createClient } from '@/utils/supabase/server'
import { createPreference } from '@/utils/mercadopago/client'
import { requireAccessToken, NoConnectedAccountError } from '@/utils/mercadopago/account'
import { buildOrderItems } from '@/lib/order'
import { MAX_SEATS } from '@/lib/constants'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'

export type CreateOrderResult = { ok: true; redirectUrl: string } | { ok: false; message: string }

const UNIQUE_VIOLATION = '23505'

const VENUE = buildVenue(TEATRO_DEL_GLOBO)
const VALID_SEAT_IDS = new Set(VENUE.seats.map((seat) => seat.id))

function siteUrl(): string {
  const origin = process.env.SITE_URL
  if (!origin) {
    throw new Error('Falta la variable de entorno SITE_URL')
  }
  return origin
}

export async function createOrder(seatIds: string[]): Promise<CreateOrderResult> {
  const origin = siteUrl()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, message: 'Iniciá sesión para reservar.' }
  }

  if (seatIds.length === 0 || seatIds.length > MAX_SEATS) {
    return { ok: false, message: 'Selección inválida.' }
  }
  if (seatIds.some((seatId) => !VALID_SEAT_IDS.has(seatId))) {
    return { ok: false, message: 'Selección inválida.' }
  }

  let accessToken: string
  try {
    accessToken = await requireAccessToken()
  } catch (error) {
    if (error instanceof NoConnectedAccountError) {
      return { ok: false, message: 'La venta no está habilitada todavía.' }
    }
    return { ok: false, message: 'No se pudo iniciar el pago. Probá de nuevo.' }
  }

  const seats = seatIds.map((seatId) => VENUE.byId.get(seatId)!)
  const { items, amount } = buildOrderItems(seats)

  const { data: orderId, error: rpcError } = await supabase.rpc('create_order', {
    p_seat_ids: seatIds,
    p_amount: amount,
  })

  if (rpcError) {
    if (rpcError.code === UNIQUE_VIOLATION) {
      return {
        ok: false,
        message: 'Alguien reservó una de estas butacas justo antes que vos. Elegí otra.',
      }
    }
    return { ok: false, message: 'No se pudo iniciar la reserva. Probá de nuevo.' }
  }

  try {
    const { initPoint, preferenceId } = await createPreference({
      orderId,
      items,
      notificationUrl: `${origin}/api/mercadopago/webhook`,
      backUrls: {
        success: `${origin}/pago/exito`,
        pending: `${origin}/pago/pendiente`,
        failure: `${origin}/pago/error`,
      },
      accessToken,
    })
    await supabase.rpc('set_order_preference', {
      p_order_id: orderId,
      p_preference_id: preferenceId,
    })
    return { ok: true, redirectUrl: initPoint }
  } catch {
    await supabase.rpc('cancel_own_order', { p_order_id: orderId })
    return { ok: false, message: 'No se pudo iniciar el pago. Probá de nuevo.' }
  }
}
