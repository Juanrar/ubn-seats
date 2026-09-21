import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getUser, fetchOwnPaidOrder, readTicketAttachment } = vi.hoisted(() => ({
  getUser: vi.fn(),
  fetchOwnPaidOrder: vi.fn(),
  readTicketAttachment: vi.fn(),
}))

vi.mock('@/utils/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser } }),
}))
vi.mock('@/utils/tickets/ownOrder', () => ({ fetchOwnPaidOrder }))
vi.mock('@/utils/tickets/attachment', () => ({ readTicketAttachment }))

import { GET } from '@/app/api/entradas/[orderId]/route'

function params(orderId: string) {
  return { params: Promise.resolve({ orderId }) }
}

beforeEach(() => {
  vi.clearAllMocks()
  getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } } })
  fetchOwnPaidOrder.mockResolvedValue({ orderId: 'o1', amount: 76000, seatIds: ['platea-F07-12'] })
  readTicketAttachment.mockResolvedValue({ name: 'entrada.png', contentBase64: 'aGVsbG8=' })
})

describe('GET /api/entradas/[orderId]', () => {
  it('devuelve 401 sin sesión', async () => {
    getUser.mockResolvedValue({ data: { user: null } })

    const response = await GET(new Request('http://localhost'), params('o1'))
    expect(response.status).toBe(401)
  })

  it('devuelve 404 si la orden no es del usuario o no está pagada', async () => {
    fetchOwnPaidOrder.mockResolvedValue(null)

    const response = await GET(new Request('http://localhost'), params('o1'))
    expect(response.status).toBe(404)
  })

  it('devuelve el archivo como adjunto', async () => {
    const response = await GET(new Request('http://localhost'), params('o1'))

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(response.headers.get('content-disposition')).toContain('attachment')
    expect(response.headers.get('content-disposition')).toContain('entrada.png')
    expect(await response.text()).toBe('hello')
  })

  it('devuelve 404 si el archivo de la entrada no se puede leer', async () => {
    readTicketAttachment.mockRejectedValue(new Error('no está'))

    const response = await GET(new Request('http://localhost'), params('o1'))
    expect(response.status).toBe(404)
  })
})
