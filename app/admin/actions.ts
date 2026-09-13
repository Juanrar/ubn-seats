'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { timingSafeEqual } from 'node:crypto'
import { ADMIN_COOKIE, SESSION_HOURS, createSessionToken, verifySessionToken } from '@/lib/admin/session'
import { disconnect } from '@/utils/mercadopago/account'
import { createServiceClient } from '@/utils/supabase/service'

export type SignInState = { error: string | null }

const SESSION_MS = SESSION_HOURS * 60 * 60 * 1000

function matches(received: string, expected: string): boolean {
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function hasValidSession(): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) return false

  const store = await cookies()
  const token = store.get(ADMIN_COOKIE)?.value
  if (!token) return false

  return verifySessionToken(secret, 'session', token, Date.now())
}

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const password = String(formData.get('password') ?? '')
  const expected = process.env.ADMIN_PASSWORD
  const secret = process.env.ADMIN_SESSION_SECRET

  if (!expected || !secret) {
    return { error: 'El panel no está configurado.' }
  }
  if (!password || !matches(password, expected)) {
    return { error: 'Contraseña incorrecta.' }
  }

  const expiresAt = Date.now() + SESSION_MS
  const token = await createSessionToken(secret, 'session', expiresAt)
  const store = await cookies()
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/admin',
    maxAge: SESSION_MS / 1000,
  })

  redirect('/admin')
}

export async function signOut(): Promise<void> {
  const store = await cookies()
  store.delete({ name: ADMIN_COOKIE, path: '/admin' })
  redirect('/admin/login')
}

export async function disconnectMercadoPago(): Promise<void> {
  if (!(await hasValidSession())) return

  await disconnect()
  revalidatePath('/admin')
}

export interface AdminActionResult {
  ok: boolean
  count: number
  message: string
}

const NO_SESSION: AdminActionResult = {
  ok: false,
  count: 0,
  message: 'La sesión venció. Volvé a entrar.',
}

function seatCount(count: number): string {
  return count === 1 ? '1 butaca' : `${count} butacas`
}

export async function blockSeats(seatIds: string[]): Promise<AdminActionResult> {
  if (!(await hasValidSession())) return NO_SESSION
  if (seatIds.length === 0) {
    return { ok: false, count: 0, message: 'No hay butacas elegidas.' }
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc('admin_block_seats', { p_seat_ids: seatIds })

  if (error) {
    return { ok: false, count: 0, message: 'No se pudieron bloquear las butacas.' }
  }

  revalidatePath('/admin')
  const count = Number(data ?? 0)

  if (count < seatIds.length) {
    return {
      ok: true,
      count,
      message: `Bloqueaste ${count} de ${seatIds.length}: alguna se vendió recién.`,
    }
  }

  return { ok: true, count, message: `Bloqueaste ${seatCount(count)}.` }
}

export async function unblockSeats(seatIds: string[]): Promise<AdminActionResult> {
  if (!(await hasValidSession())) return NO_SESSION
  if (seatIds.length === 0) {
    return { ok: false, count: 0, message: 'No hay butacas elegidas.' }
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc('admin_unblock_seats', { p_seat_ids: seatIds })

  if (error) {
    return { ok: false, count: 0, message: 'No se pudieron liberar las butacas.' }
  }

  revalidatePath('/admin')
  const count = Number(data ?? 0)
  return { ok: true, count, message: `Liberaste ${seatCount(count)}.` }
}

export async function cancelOrder(orderId: string): Promise<AdminActionResult> {
  if (!(await hasValidSession())) return NO_SESSION

  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc('admin_cancel_order', { p_order_id: orderId })

  if (error) {
    return { ok: false, count: 0, message: 'No se pudo cancelar la orden.' }
  }

  revalidatePath('/admin')
  const count = Number(data ?? 0)

  if (count === 0) {
    return { ok: true, count, message: 'La orden no se puede cancelar: ya estaba cerrada.' }
  }

  return { ok: true, count, message: `Cancelaste la orden y liberaste ${seatCount(count)}.` }
}
