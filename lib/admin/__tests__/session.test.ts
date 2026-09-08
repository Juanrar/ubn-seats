import { describe, it, expect } from 'vitest'
import { createSessionToken, verifySessionToken } from '@/lib/admin/session'

const SECRET = 'secreto-de-prueba'
const AHORA = 1_757_000_000_000
const VENCE = AHORA + 60_000

describe('createSessionToken / verifySessionToken', () => {
  it('acepta un token propio antes del vencimiento', () => {
    const token = createSessionToken(SECRET, VENCE)
    expect(verifySessionToken(SECRET, token, AHORA)).toBe(true)
  })

  it('rechaza un token firmado con otro secreto', () => {
    const token = createSessionToken('otro-secreto', VENCE)
    expect(verifySessionToken(SECRET, token, AHORA)).toBe(false)
  })

  it('rechaza un token con la firma alterada', () => {
    const [payload, firma] = createSessionToken(SECRET, VENCE).split('.')
    const alterada = firma.slice(0, -1) + (firma.endsWith('A') ? 'B' : 'A')
    expect(verifySessionToken(SECRET, `${payload}.${alterada}`, AHORA)).toBe(false)
  })

  it('rechaza un token al que le corrieron el vencimiento', () => {
    const token = createSessionToken(SECRET, VENCE)
    const firma = token.split('.')[1]
    expect(verifySessionToken(SECRET, `${VENCE + 60_000}.${firma}`, AHORA)).toBe(false)
  })

  it('rechaza un token vencido', () => {
    const token = createSessionToken(SECRET, VENCE)
    expect(verifySessionToken(SECRET, token, VENCE)).toBe(false)
  })

  it('rechaza basura sin lanzar', () => {
    for (const basura of ['', '.', 'sin-punto', 'a.b.c', '123.']) {
      expect(verifySessionToken(SECRET, basura, AHORA)).toBe(false)
    }
  })
})
