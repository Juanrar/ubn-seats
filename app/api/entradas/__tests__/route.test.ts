import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getUser, fetchOwnPaidOrder, buildTicketAttachment } = vi.hoisted(() => ({
  getUser: vi.fn(),
  fetchOwnPaidOrder: vi.fn(),
  buildTicketAttachment: vi.fn(),
}))

vi.mock('@/utils/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser } }),
}))
vi.mock('@/utils/tickets/ownOrder', () => ({ fetchOwnPaidOrder }))
vi.mock('@/utils/tickets/attachment', () => ({ buildTicketAttachment }))

import { GET } from '@/app/api/entradas/[orderId]/route'

const PERFORMANCE = { id: 'perf-sab', startsAt: '2026-12-06T00:00:00+00:00' }

function params(orderId: string) {
  return { params: Promise.resolve({ orderId }) }
}

beforeEach(() => {
  vi.clearAllMocks()
  getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } } })
  fetchOwnPaidOrder.mockResolvedValue({
    orderId: 'o1',
    amount: 76000,
    performance: PERFORMANCE,
    seatIds: ['platea-F07-12'],
  })
  buildTicketAttachment.mockResolvedValue({ name: 'entradas-ubn-2026-12-05.pdf', contentBase64: 'aGVsbG8=' })
})

describe('GET /api/entradas/[orderId]', () => {
  it('devuelve 401 sin sesión', async () => {
    getUser.mockResolvedValue({ data: { user: null } })

    const response = await GET(new Request('http://localhost'), params('o1'))
    expect(response.status).toBe(401)
    expect(fetchOwnPaidOrder).not.toHaveBeenCalled()
    expect(buildTicketAttachment).not.toHaveBeenCalled()
  })

  it('devuelve 404 si la orden no es del usuario o no está pagada', async () => {
    fetchOwnPaidOrder.mockResolvedValue(null)

    const response = await GET(new Request('http://localhost'), params('o1'))
    expect(response.status).toBe(404)
  })

  it('arma la entrada con la función y las butacas de la orden', async () => {
    await GET(new Request('http://localhost'), params('o1'))

    expect(buildTicketAttachment).toHaveBeenCalledWith(PERFORMANCE, ['platea-F07-12'])
  })

  it('devuelve el PDF como adjunto', async () => {
    const response = await GET(new Request('http://localhost'), params('o1'))

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/pdf')
    expect(response.headers.get('content-disposition')).toContain('attachment')
    expect(response.headers.get('content-disposition')).toContain('entradas-ubn-2026-12-05.pdf')
    expect(await response.text()).toBe('hello')
  })

  it('devuelve 404 si la entrada no se puede armar', async () => {
    buildTicketAttachment.mockRejectedValue(new Error('falta el fondo'))

    const response = await GET(new Request('http://localhost'), params('o1'))
    expect(response.status).toBe(404)
  })
})
