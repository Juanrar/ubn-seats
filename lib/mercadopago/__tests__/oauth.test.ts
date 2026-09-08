import { describe, it, expect } from 'vitest'
import { buildAuthorizationUrl, parseTokenResponse } from '@/lib/mercadopago/oauth'

const NOW = 1_757_000_000_000

const RESPONSE = {
  access_token: 'APP_USR-token',
  refresh_token: 'TG-refresh',
  user_id: 123456789,
  public_key: 'APP_USR-public',
  expires_in: 15_552_000,
}

describe('buildAuthorizationUrl', () => {
  it('lleva client_id, redirect_uri, state y response_type=code', () => {
    const url = new URL(
      buildAuthorizationUrl({
        clientId: 'client-1',
        redirectUri: 'https://entradas.test/admin/mercadopago/callback',
        state: 'estado-firmado',
      }),
    )
    expect(url.searchParams.get('client_id')).toBe('client-1')
    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://entradas.test/admin/mercadopago/callback',
    )
    expect(url.searchParams.get('state')).toBe('estado-firmado')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('platform_id')).toBe('mp')
  })
})

describe('parseTokenResponse', () => {
  it('convierte expires_in en un vencimiento absoluto sobre el now recibido', () => {
    const account = parseTokenResponse(RESPONSE, NOW)
    expect(account.expiresAt).toBe(NOW + 15_552_000 * 1000)
  })

  it('mapea los campos de la cuenta, con el user_id como string', () => {
    const account = parseTokenResponse(RESPONSE, NOW)
    expect(account).toMatchObject({
      mpUserId: '123456789',
      accessToken: 'APP_USR-token',
      refreshToken: 'TG-refresh',
      publicKey: 'APP_USR-public',
    })
  })

  it('deja publicKey en null cuando no viene', () => {
    const { public_key: _omitted, ...withoutPublicKey } = RESPONSE
    expect(parseTokenResponse(withoutPublicKey, NOW).publicKey).toBeNull()
  })

  it('falla si falta un campo obligatorio', () => {
    for (const field of ['access_token', 'refresh_token', 'user_id', 'expires_in'] as const) {
      const { [field]: _omitted, ...incomplete } = RESPONSE
      expect(() => parseTokenResponse(incomplete, NOW)).toThrow(/Mercado Pago/)
    }
  })

  it('falla si el payload no es un objeto', () => {
    expect(() => parseTokenResponse(null, NOW)).toThrow(/Mercado Pago/)
  })
})
