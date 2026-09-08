import { describe, it, expect, vi, beforeEach } from 'vitest'

const { create, get, MercadoPagoConfig } = vi.hoisted(() => ({
  create: vi.fn(),
  get: vi.fn(),
  MercadoPagoConfig: vi.fn(),
}))

vi.mock('mercadopago', () => ({
  MercadoPagoConfig,
  Preference: vi.fn().mockImplementation(() => ({ create })),
  Payment: vi.fn().mockImplementation(() => ({ get })),
}))

import { createPreference, getPayment, HOLD_MINUTES } from '@/utils/mercadopago/client'

const ACCESS_TOKEN = 'APP_USR-token'

beforeEach(() => {
  create.mockReset()
  get.mockReset()
  MercadoPagoConfig.mockReset()
})

describe('createPreference', () => {
  it('arma el body de la preferencia y devuelve el init_point y el id', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-04T12:00:00.000Z'))
    create.mockResolvedValue({ init_point: 'https://mp.example/checkout/abc', id: 'pref-1' })

    const result = await createPreference({
      orderId: 'order-1',
      items: [{ id: 'platea-F07-12', title: 'Fila 7, butaca 12', quantity: 1, unit_price: 38000, currency_id: 'ARS' }],
      notificationUrl: 'https://sitio.test/api/mercadopago/webhook',
      backUrls: {
        success: 'https://sitio.test/pago/exito',
        pending: 'https://sitio.test/pago/pendiente',
        failure: 'https://sitio.test/pago/error',
      },
      accessToken: ACCESS_TOKEN,
    })

    expect(MercadoPagoConfig).toHaveBeenCalledWith({ accessToken: ACCESS_TOKEN })
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
        expires: true,
        expiration_date_to: '2026-09-04T12:20:00.000Z',
      },
    })
    expect(result).toEqual({ initPoint: 'https://mp.example/checkout/abc', preferenceId: 'pref-1' })
    vi.useRealTimers()
  })

  it('la preferencia vence junto con el hold de la base', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-04T12:00:00.000Z'))
    create.mockResolvedValue({ init_point: 'https://mp.example/checkout/abc', id: 'pref-1' })

    await createPreference({
      orderId: 'order-1',
      items: [],
      notificationUrl: 'https://sitio.test/api/mercadopago/webhook',
      backUrls: { success: '', pending: '', failure: '' },
      accessToken: ACCESS_TOKEN,
    })

    const body = create.mock.calls[0][0].body
    const heldMinutes =
      (new Date(body.expiration_date_to).getTime() - Date.now()) / (60 * 1000)
    expect(heldMinutes).toBe(HOLD_MINUTES)
    vi.useRealTimers()
  })

  it('tira un error si Mercado Pago no devuelve init_point', async () => {
    create.mockResolvedValue({})

    await expect(
      createPreference({
        orderId: 'order-1',
        items: [],
        notificationUrl: 'https://sitio.test/api/mercadopago/webhook',
        backUrls: { success: '', pending: '', failure: '' },
        accessToken: ACCESS_TOKEN,
      }),
    ).rejects.toThrow('Mercado Pago no devolvió init_point')
  })
})

describe('getPayment', () => {
  it('devuelve status y externalReference del pago', async () => {
    get.mockResolvedValue({ status: 'approved', external_reference: 'order-1' })

    const result = await getPayment('123456', ACCESS_TOKEN)

    expect(MercadoPagoConfig).toHaveBeenCalledWith({ accessToken: ACCESS_TOKEN })
    expect(get).toHaveBeenCalledWith({ id: '123456' })
    expect(result).toEqual({ status: 'approved', externalReference: 'order-1' })
  })
})
