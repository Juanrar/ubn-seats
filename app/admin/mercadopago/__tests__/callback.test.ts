import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { exchangeCodeForTokens, saveAccount, cookieGet, cookieDelete } = vi.hoisted(() => ({
  exchangeCodeForTokens: vi.fn(),
  saveAccount: vi.fn(),
  cookieGet: vi.fn(),
  cookieDelete: vi.fn(),
}))

vi.mock('@/utils/mercadopago/oauth', () => ({ exchangeCodeForTokens }))
vi.mock('@/utils/mercadopago/account', () => ({ saveAccount }))
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: cookieGet, delete: cookieDelete }),
}))

import { GET } from '@/app/admin/mercadopago/callback/route'
import { createSessionToken, OAUTH_STATE_COOKIE, STATE_MINUTES } from '@/lib/admin/session'

const SECRET = 'secreto-de-prueba'

function request(params: Record<string, string>): NextRequest {
  const url = new URL('https://entradas.test/admin/mercadopago/callback')
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  return new NextRequest(url)
}

function validState(offsetMs = 0): Promise<string> {
  return createSessionToken(SECRET, 'oauth', Date.now() + STATE_MINUTES * 60 * 1000 + offsetMs)
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.ADMIN_SESSION_SECRET = SECRET
  process.env.SITE_URL = 'https://entradas.test'
})

describe('GET /admin/mercadopago/callback', () => {
  it('vincula la cuenta y vuelve a /admin', async () => {
    const state = await validState()
    cookieGet.mockReturnValue({ value: state })
    exchangeCodeForTokens.mockResolvedValue({
      mpUserId: '123456789',
      accessToken: 'APP_USR-token',
      refreshToken: 'TG-refresh',
      publicKey: null,
      expiresAt: Date.now() + 15_552_000_000,
    })

    const response = await GET(request({ code: 'code-1', state }))

    expect(exchangeCodeForTokens).toHaveBeenCalledWith(
      'code-1',
      'https://entradas.test/admin/mercadopago/callback',
    )
    expect(saveAccount).toHaveBeenCalledTimes(1)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://entradas.test/admin')
  })

  it('borra la cookie de state con el mismo path con el que se seteó', async () => {
    const state = await validState()
    cookieGet.mockReturnValue({ value: state })
    exchangeCodeForTokens.mockResolvedValue({
      mpUserId: '123456789',
      accessToken: 'APP_USR-token',
      refreshToken: 'TG-refresh',
      publicKey: null,
      expiresAt: Date.now() + 15_552_000_000,
    })

    await GET(request({ code: 'code-1', state }))

    expect(cookieDelete).toHaveBeenCalledWith({ name: OAUTH_STATE_COOKIE, path: '/admin' })
  })

  it('no vincula nada si el state no coincide con la cookie', async () => {
    cookieGet.mockReturnValue({ value: await validState() })

    const response = await GET(request({ code: 'code-1', state: await validState(1000) }))

    expect(exchangeCodeForTokens).not.toHaveBeenCalled()
    expect(saveAccount).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toContain('error=state')
  })

  it('no vincula nada si falta la cookie del state', async () => {
    cookieGet.mockReturnValue(undefined)
    const state = await validState()

    const response = await GET(request({ code: 'code-1', state }))

    expect(saveAccount).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toContain('error=state')
  })

  it('no vincula nada si el state venció', async () => {
    const expired = await createSessionToken(SECRET, 'oauth', Date.now() - 1000)
    cookieGet.mockReturnValue({ value: expired })

    const response = await GET(request({ code: 'code-1', state: expired }))

    expect(saveAccount).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toContain('error=state')
  })

  it('no vincula nada si el state es en realidad un token de sesión', async () => {
    const sessionToken = await createSessionToken(SECRET, 'session', Date.now() + 60_000)
    cookieGet.mockReturnValue({ value: sessionToken })

    const response = await GET(request({ code: 'code-1', state: sessionToken }))

    expect(saveAccount).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toContain('error=state')
  })

  it('no vincula nada sin ADMIN_SESSION_SECRET configurado', async () => {
    const state = await validState()
    cookieGet.mockReturnValue({ value: state })
    delete process.env.ADMIN_SESSION_SECRET

    const response = await GET(request({ code: 'code-1', state }))

    expect(saveAccount).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toContain('error=state')
  })

  it('vuelve con error si Mercado Pago rechazó la autorización', async () => {
    const state = await validState()
    cookieGet.mockReturnValue({ value: state })

    const response = await GET(request({ error: 'access_denied', state }))

    expect(exchangeCodeForTokens).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toContain('error=denied')
  })

  it('vuelve con error si el canje del código falla', async () => {
    const state = await validState()
    cookieGet.mockReturnValue({ value: state })
    exchangeCodeForTokens.mockRejectedValue(new Error('invalid_grant'))

    const response = await GET(request({ code: 'code-1', state }))

    expect(saveAccount).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toContain('error=exchange')
  })
})
