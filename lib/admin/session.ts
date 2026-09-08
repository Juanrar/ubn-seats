import { createHmac, timingSafeEqual } from 'node:crypto'

function sign(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function createSessionToken(secret: string, expiresAt: number): string {
  const payload = String(expiresAt)
  return `${payload}.${sign(secret, payload)}`
}

export function verifySessionToken(secret: string, token: string, now: number): boolean {
  const parts = token.split('.')
  if (parts.length !== 2) return false

  const [payload, signature] = parts
  if (!/^\d+$/.test(payload) || signature.length === 0) return false

  const expected = Buffer.from(sign(secret, payload))
  const received = Buffer.from(signature)
  if (expected.length !== received.length) return false
  if (!timingSafeEqual(expected, received)) return false

  return now < Number(payload)
}

export const ADMIN_COOKIE = 'admin_session'
export const SESSION_HOURS = 8
export const OAUTH_STATE_COOKIE = 'admin_mp_state'
export const STATE_MINUTES = 10
