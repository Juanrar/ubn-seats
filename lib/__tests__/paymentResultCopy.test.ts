import { describe, it, expect } from 'vitest'
import { isPaymentResult, paymentResultCopy } from '@/lib/paymentResultCopy'

describe('isPaymentResult', () => {
  it('acepta exito, pendiente y error', () => {
    expect(isPaymentResult('exito')).toBe(true)
    expect(isPaymentResult('pendiente')).toBe(true)
    expect(isPaymentResult('error')).toBe(true)
  })

  it('rechaza cualquier otro valor', () => {
    expect(isPaymentResult('rechazado')).toBe(false)
    expect(isPaymentResult('')).toBe(false)
  })
})

describe('paymentResultCopy', () => {
  it('devuelve heading y description no vacíos para cada resultado', () => {
    for (const result of ['exito', 'pendiente', 'error'] as const) {
      const copy = paymentResultCopy(result)
      expect(copy.heading.length).toBeGreaterThan(0)
      expect(copy.description.length).toBeGreaterThan(0)
    }
  })
})
