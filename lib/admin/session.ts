function toBase64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function sign(secret: string, payload: string): Promise<string> {
  const key = await importKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return toBase64Url(signature)
}

export type TokenPurpose = 'session' | 'oauth'

export async function createSessionToken(
  secret: string,
  purpose: TokenPurpose,
  expiresAt: number,
): Promise<string> {
  const payload = `${purpose}:${expiresAt}`
  return `${payload}.${await sign(secret, payload)}`
}

export async function verifySessionToken(
  secret: string,
  purpose: TokenPurpose,
  token: string,
  now: number,
): Promise<boolean> {
  const parts = token.split('.')
  if (parts.length !== 2) return false

  const [payload, signature] = parts
  const prefix = `${purpose}:`
  if (!payload.startsWith(prefix) || signature.length === 0) return false

  const expiresAt = payload.slice(prefix.length)
  if (!/^\d+$/.test(expiresAt)) return false

  try {
    const key = await importKey(secret)
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(signature),
      new TextEncoder().encode(payload),
    )
    if (!valid) return false
  } catch {
    return false
  }

  return now < Number(expiresAt)
}

export const ADMIN_COOKIE = 'admin_session'
export const SESSION_HOURS = 8
export const OAUTH_STATE_COOKIE = 'admin_mp_state'
export const STATE_MINUTES = 10
