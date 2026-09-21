import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getUser, fetchOwnPaidOrder, sendTicketEmail, readTicketAttachment } = vi.hoisted(() => ({
  getUser: vi.fn(),
  fetchOwnPaidOrder: vi.fn(),
  sendTicketEmail: vi.fn(),
  readTicketAttachment: vi.fn(),
}))

vi.mock('@/utils/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser } }),
}))
vi.mock('@/utils/tickets/ownOrder', () => ({ fetchOwnPaidOrder }))
vi.mock('@/utils/email/client', () => ({ sendTicketEmail }))
vi.mock('@/utils/tickets/attachment', () => ({ readTicketAttachment }))

import { resendTicket } from '@/app/mis-entradas/actions'

beforeEach(() => {
  vi.clearAllMocks()
  getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'compra@dor.com' } } })
  fetchOwnPaidOrder.mockResolvedValue({ orderId: 'o1', amount: 76000, seatIds: ['platea-F07-12'] })
  readTicketAttachment.mockResolvedValue({ name: 'entrada.png', contentBase64: 'aGVsbG8=' })
  sendTicketEmail.mockResolvedValue(undefined)
})

describe('resendTicket', () => {
  it('manda el mail al mail de la sesión', async () => {
    expect(await resendTicket('o1')).toEqual({ ok: true })

    const [params] = sendTicketEmail.mock.calls[0]
    expect(params.to).toBe('compra@dor.com')
    expect(params.attachments).toEqual([{ name: 'entrada.png', contentBase64: 'aGVsbG8=' }])
    expect(params.subject).toContain('entrada')
  })

  it('rechaza sin sesión', async () => {
    getUser.mockResolvedValue({ data: { user: null } })

    expect(await resendTicket('o1')).toEqual({ ok: false, message: 'Iniciá sesión para ver tus entradas.' })
    expect(sendTicketEmail).not.toHaveBeenCalled()
  })

  it('rechaza una orden que no es del usuario o no está pagada', async () => {
    fetchOwnPaidOrder.mockResolvedValue(null)

    expect(await resendTicket('o1')).toEqual({ ok: false, message: 'No encontramos esa entrada.' })
    expect(sendTicketEmail).not.toHaveBeenCalled()
  })

  it('avisa si el envío falla', async () => {
    sendTicketEmail.mockRejectedValue(new Error('brevo caído'))

    expect(await resendTicket('o1')).toEqual({
      ok: false,
      message: 'No pudimos enviar el mail. Probá de nuevo en un rato.',
    })
  })
})
