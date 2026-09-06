import { describe, it, expect, vi, beforeEach } from 'vitest'

const { create, get } = vi.hoisted(() => ({ create: vi.fn(), get: vi.fn() }))

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: vi.fn(),
  Preference: vi.fn().mockImplementation(() => ({ create })),
  Payment: vi.fn().mockImplementation(() => ({ get })),
}))

import { createPreference, getPayment } from '@/utils/mercadopago/client'

beforeEach(() => {
  create.mockReset()
  get.mockReset()
})

describe('createPreference', () => {
  it('arma el body de la preferencia y devuelve el init_point', async () => {
    create.mockResolvedValue({ init_point: 'https://mp.example/checkout/abc' })

    const result = await createPreference({
      orderId: 'order-1',
      items: [{ id: 'platea-F07-12', title: 'Fila 7, butaca 12', quantity: 1, unit_price: 38000, currency_id: 'ARS' }],
      notificationUrl: 'https://sitio.test/api/mercadopago/webhook',
      backUrls: {
        success: 'https://sitio.test/pago/exito',
        pending: 'https://sitio.test/pago/pendiente',
        failure: 'https://sitio.test/pago/error',
      },
    })

    expect(create).toHaveBeenCalledWith({
      body: {
        items: [{ id: 'platea-F07-12', title: 'Fila 7, butaca 12', quantity: 1, unit_price: 38000, currency_id: 'ARS' }],
        external_reference: 'order-1',
        notification_url: 'https://sitio.test/api/mercadopago/webhook',
        back_urls: {
          success: 'https://sitio.test/pago/exito',
          pending: 'https://sitio.test/pago/pendiente',
          failure: 'https://sitio.test/pago/error',
        },
        auto_return: 'approved',
      },
    })
    expect(result).toEqual({ initPoint: 'https://mp.example/checkout/abc' })
  })

  it('tira un error si Mercado Pago no devuelve init_point', async () => {
    create.mockResolvedValue({})

    await expect(
      createPreference({
        orderId: 'order-1',
        items: [],
        notificationUrl: 'https://sitio.test/api/mercadopago/webhook',
        backUrls: { success: '', pending: '', failure: '' },
      }),
    ).rejects.toThrow('Mercado Pago no devolvió init_point')
  })
})

describe('getPayment', () => {
  it('devuelve status y externalReference del pago', async () => {
    get.mockResolvedValue({ status: 'approved', external_reference: 'order-1' })

    const result = await getPayment('123456')

    expect(get).toHaveBeenCalledWith({ id: '123456' })
    expect(result).toEqual({ status: 'approved', externalReference: 'order-1' })
  })
})
