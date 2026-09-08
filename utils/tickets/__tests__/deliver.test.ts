import { describe, it, expect, vi, beforeEach } from 'vitest'

const { sendTicketEmail, readTicketAttachment, fetchOrderSummary } = vi.hoisted(() => ({
  sendTicketEmail: vi.fn(),
  readTicketAttachment: vi.fn(),
  fetchOrderSummary: vi.fn(),
}))

vi.mock('@/utils/email/client', () => ({ sendTicketEmail }))
vi.mock('@/utils/tickets/attachment', () => ({ readTicketAttachment }))
vi.mock('@/utils/orders', () => ({ fetchOrderSummary }))

import { deliverTicketEmail } from '@/utils/tickets/deliver'

const ORDER_ID = '6f1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d'
const USER_ID = '11111111-2222-4333-8444-555555555555'
const ATTACHMENT = { name: 'entrada.png', contentBase64: 'aGVsbG8=' }

function supabaseStub({
  claim = true,
  email = 'compradora@correo.test',
}: { claim?: boolean; email?: string | null } = {}) {
  const rpc = vi.fn(async (name: string) => (name === 'claim_ticket_delivery' ? { data: claim, error: null } : { data: null, error: null }))
  const getUserById = vi.fn(async () => ({ data: { user: email ? { id: USER_ID, email } : null }, error: null }))
  const from = vi.fn(() => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { user_id: USER_ID }, error: null }) }) }),
  }))
  return { rpc, from, auth: { admin: { getUserById } } }
}

beforeEach(() => {
  sendTicketEmail.mockReset().mockResolvedValue(undefined)
  readTicketAttachment.mockReset().mockResolvedValue(ATTACHMENT)
  fetchOrderSummary.mockReset().mockResolvedValue({
    status: 'confirmed',
    amount: 5,
    seatIds: ['platea-F07-12', 'platea-F07-11'],
  })
})

describe('deliverTicketEmail', () => {
  it('manda el mail al comprador con la entrada adjunta', async () => {
    const supabase = supabaseStub()

    await deliverTicketEmail(supabase as never, ORDER_ID)

    expect(supabase.rpc).toHaveBeenCalledWith('claim_ticket_delivery', { p_order_id: ORDER_ID })
    expect(sendTicketEmail).toHaveBeenCalledTimes(1)
    const params = sendTicketEmail.mock.calls[0][0]
    expect(params.to).toBe('compradora@correo.test')
    expect(params.subject).toBe('Tus 2 entradas para Función de prueba')
    expect(params.text).toContain('Fila 7, butaca 11, Platea B')
    expect(params.attachments).toEqual([ATTACHMENT])
  })

  it('no manda nada si otra notificación ya reclamó la entrega', async () => {
    const supabase = supabaseStub({ claim: false })

    await deliverTicketEmail(supabase as never, ORDER_ID)

    expect(sendTicketEmail).not.toHaveBeenCalled()
  })

  it('libera la entrega si el envío falla, para poder reintentarla', async () => {
    const supabase = supabaseStub()
    sendTicketEmail.mockRejectedValue(new Error('Brevo caído'))

    await expect(deliverTicketEmail(supabase as never, ORDER_ID)).rejects.toThrow('Brevo caído')

    expect(supabase.rpc).toHaveBeenCalledWith('release_ticket_delivery', { p_order_id: ORDER_ID })
  })

  it('libera la entrega si el comprador no tiene mail', async () => {
    const supabase = supabaseStub({ email: null })

    await expect(deliverTicketEmail(supabase as never, ORDER_ID)).rejects.toThrow()

    expect(sendTicketEmail).not.toHaveBeenCalled()
    expect(supabase.rpc).toHaveBeenCalledWith('release_ticket_delivery', { p_order_id: ORDER_ID })
  })
})
