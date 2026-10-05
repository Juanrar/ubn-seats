import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getUser, fetchOwnPaidOrder, sendTicketEmail, buildTicketAttachment, buildTicketEmail } =
  vi.hoisted(() => ({
    getUser: vi.fn(),
    fetchOwnPaidOrder: vi.fn(),
    sendTicketEmail: vi.fn(),
    buildTicketAttachment: vi.fn(),
    buildTicketEmail: vi.fn(),
  }))

vi.mock('@/utils/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser } }),
}))
vi.mock('@/utils/tickets/ownOrder', () => ({ fetchOwnPaidOrder }))
vi.mock('@/utils/email/client', () => ({ sendTicketEmail }))
vi.mock('@/utils/tickets/attachment', () => ({ buildTicketAttachment }))
vi.mock('@/lib/tickets/message', () => ({ buildTicketEmail }))

import { resendTicket } from '@/app/mis-entradas/actions'

beforeEach(() => {
  vi.clearAllMocks()
  getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'compra@dor.com' } } })
  fetchOwnPaidOrder.mockResolvedValue({
    orderId: 'o1',
    amount: 76000,
    performance: { id: 'perf-sab', startsAt: '2026-12-06T00:00:00+00:00' },
    seatIds: ['platea-F07-12'],
  })
  buildTicketAttachment.mockResolvedValue({ name: 'entradas-ubn-2026-12-05.pdf', contentBase64: 'aGVsbG8=' })
  buildTicketEmail.mockReturnValue({
    subject: 'Tu entrada para la obra',
    text: 'texto',
    html: '<p>html</p>',
  })
  sendTicketEmail.mockResolvedValue(undefined)
})

describe('resendTicket', () => {
  it('manda el mail al mail de la sesión', async () => {
    expect(await resendTicket('o1')).toEqual({ ok: true })

    const [params] = sendTicketEmail.mock.calls[0]
    expect(params.to).toBe('compra@dor.com')
    expect(params.attachments).toEqual([{ name: 'entradas-ubn-2026-12-05.pdf', contentBase64: 'aGVsbG8=' }])
    expect(buildTicketAttachment).toHaveBeenCalledWith(
      { id: 'perf-sab', startsAt: '2026-12-06T00:00:00+00:00' },
      ['platea-F07-12'],
    )
    expect(params.subject).toBe('Tu entrada para la obra')
    expect(buildTicketEmail).toHaveBeenCalledWith({
      seatIds: ['platea-F07-12'],
      amount: 76000,
      performance: { id: 'perf-sab', startsAt: '2026-12-06T00:00:00+00:00' },
    })
  })

  it('rechaza sin sesión', async () => {
    getUser.mockResolvedValue({ data: { user: null } })

    expect(await resendTicket('o1')).toEqual({ ok: false, message: 'Iniciá sesión para ver tus entradas.' })
    expect(sendTicketEmail).not.toHaveBeenCalled()
  })

  it('rechaza una sesión sin mail', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1', email: null } } })

    expect(await resendTicket('o1')).toEqual({
      ok: false,
      message: 'Tu cuenta no tiene un mail donde enviarla.',
    })
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

  it('avisa si no se puede armar la entrada', async () => {
    buildTicketAttachment.mockRejectedValue(new Error('no está'))

    expect(await resendTicket('o1')).toEqual({
      ok: false,
      message: 'No pudimos enviar el mail. Probá de nuevo en un rato.',
    })
    expect(sendTicketEmail).not.toHaveBeenCalled()
  })
})
