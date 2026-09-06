import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { getPayment, rpc, validate, FakeInvalidWebhookSignatureError } = vi.hoisted(() => ({
  getPayment: vi.fn(),
  rpc: vi.fn(),
  validate: vi.fn(),
  FakeInvalidWebhookSignatureError: class FakeInvalidWebhookSignatureError extends Error {},
}))

vi.mock('@/utils/mercadopago/client', () => ({ getPayment }))
vi.mock('@/utils/supabase/service', () => ({ createServiceClient: () => ({ rpc }) }))
vi.mock('mercadopago', () => ({
  WebhookSignatureValidator: { validate },
  InvalidWebhookSignatureError: FakeInvalidWebhookSignatureError,
}))

import { POST } from '@/app/api/mercadopago/webhook/route'

function request(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, { method: 'POST', headers })
}

beforeEach(() => {
  getPayment.mockReset()
  rpc.mockReset()
  validate.mockReset()
})

describe('POST /api/mercadopago/webhook', () => {
  it('ignora notificaciones que no son de tipo payment', async () => {
    const res = await POST(request('https://sitio.test/api/mercadopago/webhook?type=merchant_order&data.id=1'))
    expect(res.status).toBe(200)
    expect(validate).not.toHaveBeenCalled()
  })

  it('devuelve 401 si la firma es inválida', async () => {
    validate.mockImplementation(() => {
      throw new FakeInvalidWebhookSignatureError('mala firma')
    })

    const res = await POST(
      request('https://sitio.test/api/mercadopago/webhook?type=payment&data.id=123', {
        'x-signature': 'ts=1,v1=deadbeef',
        'x-request-id': 'req-1',
      }),
    )

    expect(res.status).toBe(401)
    expect(getPayment).not.toHaveBeenCalled()
  })

  it('pago approved: confirma la orden', async () => {
    validate.mockReturnValue(undefined)
    getPayment.mockResolvedValue({ status: 'approved', externalReference: 'order-1' })

    const res = await POST(
      request('https://sitio.test/api/mercadopago/webhook?type=payment&data.id=123', {
        'x-signature': 'ts=1,v1=deadbeef',
        'x-request-id': 'req-1',
      }),
    )

    expect(rpc).toHaveBeenCalledWith('set_order_status', {
      p_order_id: 'order-1',
      p_status: 'confirmed',
      p_mp_payment_id: '123',
    })
    expect(res.status).toBe(200)
  })

  it('pago rejected: cancela la orden', async () => {
    validate.mockReturnValue(undefined)
    getPayment.mockResolvedValue({ status: 'rejected', externalReference: 'order-1' })

    await POST(
      request('https://sitio.test/api/mercadopago/webhook?type=payment&data.id=123', {
        'x-signature': 'ts=1,v1=deadbeef',
        'x-request-id': 'req-1',
      }),
    )

    expect(rpc).toHaveBeenCalledWith('set_order_status', {
      p_order_id: 'order-1',
      p_status: 'cancelled',
      p_mp_payment_id: '123',
    })
  })

  it('pago pending: no toca la orden', async () => {
    validate.mockReturnValue(undefined)
    getPayment.mockResolvedValue({ status: 'pending', externalReference: 'order-1' })

    const res = await POST(
      request('https://sitio.test/api/mercadopago/webhook?type=payment&data.id=123', {
        'x-signature': 'ts=1,v1=deadbeef',
        'x-request-id': 'req-1',
      }),
    )

    expect(rpc).not.toHaveBeenCalled()
    expect(res.status).toBe(200)
  })
})
