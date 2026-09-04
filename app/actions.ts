'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { MAX_SEATS } from '@/lib/constants'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'

export type ReserveSeatsResult = { ok: true } | { ok: false; message: string }

const UNIQUE_VIOLATION = '23505'

const VALID_SEAT_IDS = new Set(buildVenue(TEATRO_DEL_GLOBO).seats.map((seat) => seat.id))

export async function reserveSeats(seatIds: string[]): Promise<ReserveSeatsResult> {
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

  const rows = seatIds.map((seatId) => ({ seat_id: seatId, user_id: user.id }))
  const { error } = await supabase.from('reservations').insert(rows)

  if (error) {
    revalidatePath('/')
    if (error.code === UNIQUE_VIOLATION) {
      return {
        ok: false,
        message: 'Alguien reservó una de estas butacas justo antes que vos. Elegí otra.',
      }
    }
    return { ok: false, message: 'No se pudo confirmar la reserva. Probá de nuevo.' }
  }

  revalidatePath('/')
  return { ok: true }
}
