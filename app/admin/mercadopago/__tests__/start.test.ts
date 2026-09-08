import { describe, it, expect, vi, beforeEach } from 'vitest'

const { cookieSet } = vi.hoisted(() => ({ cookieSet: vi.fn() }))

vi.mock('next/headers', () => ({
  cookies: async () => ({ set: cookieSet }),
}))

import { GET } from '@/app/admin/mercadopago/start/route'
import { verifySessionToken, OAUTH_STATE_COOKIE } from '@/lib/admin/session'

const SECRET = 'secreto-de-prueba'

beforeEach(() => {
  vi.clearAllMocks()
  process.env.ADMIN_SESSION_SECRET = SECRET
  process.env.SITE_URL = 'https://entradas.test'
  process.env.MP_CLIENT_ID = 'client-1'
})

describe('GET /admin/mercadopago/start', () => {
  it('arma la URL de autorización con un state firmado como oauth y setea la cookie', async () => {
    const response = await GET()

    expect(cookieSet).toHaveBeenCalledTimes(1)
    const [nombre, valor, opciones] = cookieSet.mock.calls[0]
    expect(nombre).toBe(OAUTH_STATE_COOKIE)
    expect(opciones.path).toBe('/admin')
    expect(await verifySessionToken(SECRET, 'oauth', valor, Date.now())).toBe(true)
    expect(await verifySessionToken(SECRET, 'session', valor, Date.now())).toBe(false)

    const location = response.headers.get('location')!
    expect(location).toContain('auth.mercadopago.com')
    expect(new URL(location).searchParams.get('state')).toBe(valor)
  })

  it('no arma ninguna URL de autorización sin ADMIN_SESSION_SECRET configurado', async () => {
    delete process.env.ADMIN_SESSION_SECRET

    const response = await GET()

    expect(cookieSet).not.toHaveBeenCalled()
    const location = response.headers.get('location')!
    expect(location).toBe('https://entradas.test/admin?error=config')
  })
})
