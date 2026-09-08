// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { getUser } = vi.hoisted(() => ({
  getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getUser } }),
}))

import { middleware } from '@/middleware'
import { ADMIN_COOKIE, createSessionToken } from '@/lib/admin/session'

const SECRET = 'secreto-de-prueba'

function request(pathname: string, cookieValue?: string): NextRequest {
  const url = new URL(`https://entradas.test${pathname}`)
  const headers = new Headers()
  if (cookieValue) headers.set('cookie', `${ADMIN_COOKIE}=${cookieValue}`)
  return new NextRequest(url, { headers })
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.ADMIN_SESSION_SECRET = SECRET
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.test'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'clave-anonima'
})

describe('middleware', () => {
  it('redirige a /admin/login una request a /admin sin cookie', async () => {
    const response = await middleware(request('/admin'))
    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/admin/login')
  })

  it('deja pasar /admin/login sin cookie', async () => {
    const response = await middleware(request('/admin/login'))
    expect(response.headers.get('location')).toBeNull()
  })

  it('redirige el callback de Mercado Pago sin cookie', async () => {
    const response = await middleware(request('/admin/mercadopago/callback'))
    expect(new URL(response.headers.get('location')!).pathname).toBe('/admin/login')
  })

  it('deja pasar con una cookie de sesión válida', async () => {
    const token = await createSessionToken(SECRET, 'session', Date.now() + 60_000)
    const response = await middleware(request('/admin', token))
    expect(response.headers.get('location')).toBeNull()
  })
})
