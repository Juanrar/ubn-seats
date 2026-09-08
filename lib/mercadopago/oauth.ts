export interface ConnectedAccount {
  mpUserId: string
  accessToken: string
  refreshToken: string
  publicKey: string | null
  expiresAt: number
}

export const AUTHORIZATION_URL = 'https://auth.mercadopago.com.ar/authorization'

export function buildAuthorizationUrl(params: {
  clientId: string
  redirectUri: string
  state: string
}): string {
  const url = new URL(AUTHORIZATION_URL)
  url.searchParams.set('client_id', params.clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('platform_id', 'mp')
  url.searchParams.set('redirect_uri', params.redirectUri)
  url.searchParams.set('state', params.state)
  return url.toString()
}

export function parseTokenResponse(payload: unknown, now: number): ConnectedAccount {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Mercado Pago devolvió una respuesta de token inesperada')
  }

  const data = payload as Record<string, unknown>
  const accessToken = data.access_token
  const refreshToken = data.refresh_token
  const mpUserId = data.user_id
  const expiresIn = data.expires_in

  if (
    typeof accessToken !== 'string' ||
    typeof refreshToken !== 'string' ||
    (typeof mpUserId !== 'string' && typeof mpUserId !== 'number') ||
    typeof expiresIn !== 'number'
  ) {
    throw new Error('Mercado Pago devolvió una respuesta de token incompleta')
  }

  return {
    mpUserId: String(mpUserId),
    accessToken,
    refreshToken,
    publicKey: typeof data.public_key === 'string' ? data.public_key : null,
    expiresAt: now + expiresIn * 1000,
  }
}
