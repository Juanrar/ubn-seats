'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export type ReserveSeatsResult = { ok: true } | { ok: false; message: string }

const UNIQUE_VIOLATION = '23505'

export async function reserveSeats(seatIds: string[]): Promise<ReserveSeatsResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, message: 'Iniciá sesión para reservar.' }
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
