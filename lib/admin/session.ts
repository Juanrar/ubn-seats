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

  const [payload, firma] = parts
  if (!/^\d+$/.test(payload) || firma.length === 0) return false

  const esperada = Buffer.from(sign(secret, payload))
  const recibida = Buffer.from(firma)
  if (esperada.length !== recibida.length) return false
  if (!timingSafeEqual(esperada, recibida)) return false

  return now < Number(payload)
}
