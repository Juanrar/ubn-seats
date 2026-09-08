'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { timingSafeEqual } from 'node:crypto'
import { ADMIN_COOKIE, SESSION_HOURS, createSessionToken } from '@/lib/admin/session'

export type SignInState = { error: string | null }

const SESSION_MS = SESSION_HOURS * 60 * 60 * 1000

function matches(received: string, expected: string): boolean {
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
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
  const token = createSessionToken(secret, expiresAt)
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
  store.delete(ADMIN_COOKIE)
  redirect('/admin/login')
}
