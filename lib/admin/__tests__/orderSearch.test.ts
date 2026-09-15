import { describe, it, expect } from 'vitest'
import { filterOrdersByEmail } from '@/lib/admin/orderSearch'

const ORDERS = [
  { id: '1', email: 'Ana@Mail.com' },
  { id: '2', email: 'lucia@otro.com' },
  { id: '3', email: null },
]

describe('filterOrdersByEmail', () => {
  it('con búsqueda vacía devuelve todas', () => {
    expect(filterOrdersByEmail(ORDERS, '   ')).toEqual(ORDERS)
  })

  it('busca por parte del mail sin importar mayúsculas ni espacios', () => {
    expect(filterOrdersByEmail(ORDERS, '  ana@MAIL ').map((o) => o.id)).toEqual(['1'])
  })

  it('una orden sin mail no aparece en una búsqueda', () => {
    expect(filterOrdersByEmail(ORDERS, 'com').map((o) => o.id)).toEqual(['1', '2'])
  })
})
