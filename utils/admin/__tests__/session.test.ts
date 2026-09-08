import { describe, it, expect } from 'vitest'
import { createSessionToken, verifySessionToken } from '@/utils/admin/session'

const SECRET = 'secreto-de-prueba'
const NOW = 1_757_000_000_000
const EXPIRES = NOW + 60_000

describe('createSessionToken / verifySessionToken', () => {
  it('acepta un token propio antes del vencimiento', async () => {
    const token = await createSessionToken(SECRET, EXPIRES)
    expect(await verifySessionToken(SECRET, token, NOW)).toBe(true)
  })

  it('rechaza un token firmado con otro secreto', async () => {
    const token = await createSessionToken('otro-secreto', EXPIRES)
    expect(await verifySessionToken(SECRET, token, NOW)).toBe(false)
  })

  it('rechaza un token con la firma alterada', async () => {
    const [payload, signature] = (await createSessionToken(SECRET, EXPIRES)).split('.')
    const tampered = signature.slice(0, -1) + (signature.endsWith('A') ? 'B' : 'A')
    expect(await verifySessionToken(SECRET, `${payload}.${tampered}`, NOW)).toBe(false)
  })

  it('rechaza un token al que le corrieron el vencimiento', async () => {
    const token = await createSessionToken(SECRET, EXPIRES)
    const signature = token.split('.')[1]
    expect(await verifySessionToken(SECRET, `${EXPIRES + 60_000}.${signature}`, NOW)).toBe(false)
  })

  it('rechaza un token vencido', async () => {
    const token = await createSessionToken(SECRET, EXPIRES)
    expect(await verifySessionToken(SECRET, token, EXPIRES)).toBe(false)
  })

  it('rechaza basura sin lanzar', async () => {
    for (const garbage of ['', '.', 'sin-punto', 'a.b.c', '123.']) {
      expect(await verifySessionToken(SECRET, garbage, NOW)).toBe(false)
    }
  })

  it('rechaza una firma con caracteres base64url inválidos sin lanzar', async () => {
    expect(await verifySessionToken(SECRET, '123.!!!no-es-base64!!!', NOW)).toBe(false)
  })
})
