import { parseTokenResponse, type ConnectedAccount } from '@/lib/mercadopago/oauth'

export const TOKEN_URL = 'https://api.mercadopago.com/oauth/token'

async function requestToken(body: Record<string, string>): Promise<ConnectedAccount> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Mercado Pago rechazó el pedido de token (${response.status})`)
  }

  return parseTokenResponse(await response.json(), Date.now())
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
): Promise<ConnectedAccount> {
  return requestToken({
    grant_type: 'authorization_code',
    client_id: process.env.MP_CLIENT_ID!,
    client_secret: process.env.MP_CLIENT_SECRET!,
    code,
    redirect_uri: redirectUri,
  })
}

export async function refreshTokens(refreshToken: string): Promise<ConnectedAccount> {
  return requestToken({
    grant_type: 'refresh_token',
    client_id: process.env.MP_CLIENT_ID!,
    client_secret: process.env.MP_CLIENT_SECRET!,
    refresh_token: refreshToken,
  })
}
