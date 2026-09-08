import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exchangeCodeForTokens, refreshTokens, TOKEN_URL } from '@/utils/mercadopago/oauth'

const RESPONSE = {
  access_token: 'APP_USR-token',
  refresh_token: 'TG-refresh',
  user_id: 123456789,
  public_key: 'APP_USR-public',
  expires_in: 15_552_000,
}

function mockFetch(ok: boolean, body: unknown) {
  const fetchMock = vi.fn(async () => ({
    ok,
    status: ok ? 200 : 400,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  process.env.MP_CLIENT_ID = 'client-1'
  process.env.MP_CLIENT_SECRET = 'secret-1'
})

afterEach(() => vi.unstubAllGlobals())

describe('exchangeCodeForTokens', () => {
  it('postea el authorization_code con las credenciales de la aplicación', async () => {
    const fetchMock = mockFetch(true, RESPONSE)

    const account = await exchangeCodeForTokens('code-1', 'https://entradas.test/cb')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(TOKEN_URL)
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({
      grant_type: 'authorization_code',
      client_id: 'client-1',
      client_secret: 'secret-1',
      code: 'code-1',
      redirect_uri: 'https://entradas.test/cb',
    })
    expect(account.mpUserId).toBe('123456789')
    expect(account.accessToken).toBe('APP_USR-token')
  })

  it('lanza si Mercado Pago responde con error', async () => {
    mockFetch(false, { message: 'invalid_grant' })
    await expect(exchangeCodeForTokens('code-1', 'https://entradas.test/cb')).rejects.toThrow(
      /Mercado Pago/,
    )
  })
})

describe('refreshTokens', () => {
  it('postea el refresh_token', async () => {
    const fetchMock = mockFetch(true, RESPONSE)

    await refreshTokens('TG-viejo')

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(String(init.body))).toEqual({
      grant_type: 'refresh_token',
      client_id: 'client-1',
      client_secret: 'secret-1',
      refresh_token: 'TG-viejo',
    })
  })

  it('lanza si Mercado Pago responde con error', async () => {
    mockFetch(false, { message: 'invalid_grant' })
    await expect(refreshTokens('TG-viejo')).rejects.toThrow(/Mercado Pago/)
  })
})
