import { describe, it, expect } from 'vitest'
import { createSessionToken, verifySessionToken } from '@/lib/admin/session'

const SECRET = 'secreto-de-prueba'
const NOW = 1_757_000_000_000
const EXPIRES = NOW + 60_000

describe('createSessionToken / verifySessionToken', () => {
  it('acepta un token propio antes del vencimiento', async () => {
    const token = await createSessionToken(SECRET, 'session', EXPIRES)
    expect(await verifySessionToken(SECRET, 'session', token, NOW)).toBe(true)
  })

  it('rechaza un token firmado con otro secreto', async () => {
    const token = await createSessionToken('otro-secreto', 'session', EXPIRES)
    expect(await verifySessionToken(SECRET, 'session', token, NOW)).toBe(false)
  })

  it('rechaza un token con la firma alterada', async () => {
    const [payload, signature] = (await createSessionToken(SECRET, 'session', EXPIRES)).split('.')
    const tampered = signature.slice(0, -1) + (signature.endsWith('A') ? 'B' : 'A')
    expect(await verifySessionToken(SECRET, 'session', `${payload}.${tampered}`, NOW)).toBe(false)
  })

  it('rechaza un token al que le corrieron el vencimiento', async () => {
    const token = await createSessionToken(SECRET, 'session', EXPIRES)
    const signature = token.split('.')[1]
    expect(
      await verifySessionToken(SECRET, 'session', `session:${EXPIRES + 60_000}.${signature}`, NOW),
    ).toBe(false)
  })

  it('rechaza un token vencido', async () => {
    const token = await createSessionToken(SECRET, 'session', EXPIRES)
    expect(await verifySessionToken(SECRET, 'session', token, EXPIRES)).toBe(false)
  })

  it('rechaza basura sin lanzar', async () => {
    for (const garbage of ['', '.', 'sin-punto', 'a.b.c', '123.']) {
      expect(await verifySessionToken(SECRET, 'session', garbage, NOW)).toBe(false)
    }
  })

  it('rechaza una firma con caracteres base64url inválidos sin lanzar', async () => {
    expect(await verifySessionToken(SECRET, 'session', 'session:123.!!!no-es-base64!!!', NOW)).toBe(
      false,
    )
  })

  it('un token de sesión no verifica como token de state', async () => {
    const token = await createSessionToken(SECRET, 'session', EXPIRES)
    expect(await verifySessionToken(SECRET, 'oauth', token, NOW)).toBe(false)
  })

  it('un token de state no verifica como token de sesión', async () => {
    const token = await createSessionToken(SECRET, 'oauth', EXPIRES)
    expect(await verifySessionToken(SECRET, 'session', token, NOW)).toBe(false)
  })
})
