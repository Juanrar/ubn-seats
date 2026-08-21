import { describe, it, expect } from 'vitest'
import { formatPrice, formatTotal } from '@/lib/format'

describe('formatPrice', () => {
  it('usa punto como separador de miles', () => {
    expect(formatPrice(45000)).toBe('45.000')
    expect(formatPrice(1234567)).toBe('1.234.567')
  })

  it('no agrega decimales', () => {
    expect(formatPrice(30000)).toBe('30.000')
  })
})

describe('formatTotal', () => {
  it('antepone el signo peso', () => {
    expect(formatTotal(90000)).toBe('$ 90.000')
  })

  it('muestra cero cuando no hay selección', () => {
    expect(formatTotal(0)).toBe('$ 0')
  })
})
