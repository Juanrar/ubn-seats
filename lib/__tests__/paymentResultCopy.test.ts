import { describe, it, expect } from 'vitest'
import { isPaymentResult, orderStatusCopy, paymentResultCopy } from '@/lib/paymentResultCopy'

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

  it('no habilita una ruta /pago para los estados de orden', () => {
    expect(isPaymentResult('paid_without_seats')).toBe(false)
    expect(isPaymentResult('confirmed')).toBe(false)
  })
})

describe('orderStatusCopy', () => {
  it('mapea los estados de orden a los mismos textos que la ruta', () => {
    expect(orderStatusCopy('confirmed')).toEqual(paymentResultCopy('exito'))
    expect(orderStatusCopy('pending')).toEqual(paymentResultCopy('pendiente'))
    expect(orderStatusCopy('cancelled')).toEqual(paymentResultCopy('error'))
  })

  it('paid_without_seats tiene texto propio: no dice que el pago se está confirmando', () => {
    const copy = orderStatusCopy('paid_without_seats')
    expect(copy).not.toEqual(paymentResultCopy('pendiente'))
    expect(copy.description).not.toMatch(/apenas se acredite/)
    expect(copy.description).toMatch(/escribinos/)
  })

  it('cae en pendiente ante un estado desconocido', () => {
    expect(orderStatusCopy('vaya-a-saber')).toEqual(paymentResultCopy('pendiente'))
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
