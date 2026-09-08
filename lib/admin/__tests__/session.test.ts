import { describe, it, expect } from 'vitest'
import { createSessionToken, verifySessionToken } from '@/utils/admin/session'

const SECRET = 'secreto-de-prueba'
const NOW = 1_757_000_000_000
const EXPIRES = NOW + 60_000

describe('createSessionToken / verifySessionToken', () => {
  it('acepta un token propio antes del vencimiento', () => {
    const token = createSessionToken(SECRET, EXPIRES)
    expect(verifySessionToken(SECRET, token, NOW)).toBe(true)
  })

  it('rechaza un token firmado con otro secreto', () => {
    const token = createSessionToken('otro-secreto', EXPIRES)
    expect(verifySessionToken(SECRET, token, NOW)).toBe(false)
  })

  it('rechaza un token con la firma alterada', () => {
    const [payload, signature] = createSessionToken(SECRET, EXPIRES).split('.')
    const tampered = signature.slice(0, -1) + (signature.endsWith('A') ? 'B' : 'A')
    expect(verifySessionToken(SECRET, `${payload}.${tampered}`, NOW)).toBe(false)
  })

  it('rechaza un token al que le corrieron el vencimiento', () => {
    const token = createSessionToken(SECRET, EXPIRES)
    const signature = token.split('.')[1]
    expect(verifySessionToken(SECRET, `${EXPIRES + 60_000}.${signature}`, NOW)).toBe(false)
  })

  it('rechaza un token vencido', () => {
    const token = createSessionToken(SECRET, EXPIRES)
    expect(verifySessionToken(SECRET, token, EXPIRES)).toBe(false)
  })

  it('rechaza basura sin lanzar', () => {
    for (const garbage of ['', '.', 'sin-punto', 'a.b.c', '123.']) {
      expect(verifySessionToken(SECRET, garbage, NOW)).toBe(false)
    }
  })
})
