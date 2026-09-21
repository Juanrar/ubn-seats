import { describe, it, expect } from 'vitest'
import { ticketContentType } from '@/utils/tickets/contentType'

describe('ticketContentType', () => {
  it('reconoce el png', () => {
    expect(ticketContentType('entrada.png')).toBe('image/png')
  })

  it('reconoce el pdf', () => {
    expect(ticketContentType('entrada.pdf')).toBe('application/pdf')
  })

  it('no distingue mayúsculas', () => {
    expect(ticketContentType('ENTRADA.PDF')).toBe('application/pdf')
  })

  it('cae en un tipo genérico si no conoce la extensión', () => {
    expect(ticketContentType('entrada.xyz')).toBe('application/octet-stream')
  })
})
