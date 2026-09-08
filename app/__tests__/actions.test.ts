import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'
import { MAX_SEATS } from '@/lib/constants'

const { getUser, rpc, createPreference } = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  createPreference: vi.fn(),
}))

vi.mock('@/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    rpc,
  }),
}))
vi.mock('@/utils/mercadopago/client', () => ({ createPreference }))

import { createOrder } from '@/app/actions'

const seatIds = buildVenue(TEATRO_DEL_GLOBO).seats.map((seat) => seat.id)

const SITE_URL = 'https://butacas.test'

beforeEach(() => {
  getUser.mockReset()
  rpc.mockReset()
  createPreference.mockReset()
  process.env.SITE_URL = SITE_URL
})

describe('createOrder', () => {
  it('rechaza sin sesión', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    const result = await createOrder(['platea-F07-12'])
    expect(result).toEqual({ ok: false, message: 'Iniciá sesión para reservar.' })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('rechaza un array vacío sin llamar al RPC', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const result = await createOrder([])
    expect(result).toEqual({ ok: false, message: 'Selección inválida.' })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('rechaza más butacas que MAX_SEATS sin llamar al RPC', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const result = await createOrder(seatIds.slice(0, MAX_SEATS + 1))
    expect(result).toEqual({ ok: false, message: 'Selección inválida.' })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('rechaza una butaca que no existe en el catálogo sin llamar al RPC', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const result = await createOrder(['not-a-real-seat'])
    expect(result).toEqual({ ok: false, message: 'Selección inválida.' })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('cobra el total exacto del catálogo, no lo que mande el cliente', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    rpc.mockResolvedValue({ data: 'order-1', error: null })
    createPreference.mockResolvedValue({
      initPoint: 'https://mp.example/checkout/abc',
      preferenceId: 'pref-1',
    })

    const selection = ['platea-F02-1', 'platea-F07-12', 'platea-F14-3']
    await createOrder(selection)

    expect(rpc).toHaveBeenNthCalledWith(1, 'create_order', {
      p_seat_ids: selection,
      p_amount: 6,
    })
  })

  it('crea la orden, la preferencia, y devuelve el init_point como redirectUrl', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    rpc.mockResolvedValue({ data: 'order-1', error: null })
    createPreference.mockResolvedValue({
      initPoint: 'https://mp.example/checkout/abc',
      preferenceId: 'pref-1',
    })

    const result = await createOrder(['platea-F02-1', 'platea-F07-12'])

    expect(rpc).toHaveBeenNthCalledWith(1, 'create_order', {
      p_seat_ids: ['platea-F02-1', 'platea-F07-12'],
      p_amount: 3,
    })
    expect(createPreference).toHaveBeenCalledWith({
      orderId: 'order-1',
      items: [
        {
          id: 'platea-F02-1',
          title: 'Fila 2, butaca 1, Platea A',
          quantity: 1,
          unit_price: 1,
          currency_id: 'ARS',
        },
        {
          id: 'platea-F07-12',
          title: 'Fila 7, butaca 12, Platea B',
          quantity: 1,
          unit_price: 2,
          currency_id: 'ARS',
        },
      ],
      notificationUrl: `${SITE_URL}/api/mercadopago/webhook`,
      backUrls: {
        success: `${SITE_URL}/pago/exito`,
        pending: `${SITE_URL}/pago/pendiente`,
        failure: `${SITE_URL}/pago/error`,
      },
    })
    expect(result).toEqual({ ok: true, redirectUrl: 'https://mp.example/checkout/abc' })
  })

  it('guarda el id de preferencia en la orden', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    rpc.mockResolvedValue({ data: 'order-1', error: null })
    createPreference.mockResolvedValue({
      initPoint: 'https://mp.example/checkout/abc',
      preferenceId: 'pref-1',
    })

    await createOrder(['platea-F07-12'])

    expect(rpc).toHaveBeenNthCalledWith(2, 'set_order_preference', {
      p_order_id: 'order-1',
      p_preference_id: 'pref-1',
    })
  })

  it('falla ruidosamente si falta SITE_URL, sin tocar la base', async () => {
    delete process.env.SITE_URL
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    await expect(createOrder(['platea-F07-12'])).rejects.toThrow('SITE_URL')
    expect(rpc).not.toHaveBeenCalled()
  })

  it('devuelve mensaje de conflicto si el RPC choca con el índice único (23505)', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    rpc.mockResolvedValueOnce({ data: null, error: { code: '23505' } })

    const result = await createOrder(['platea-F07-12'])

    expect(result).toEqual({
      ok: false,
      message: 'Alguien reservó una de estas butacas justo antes que vos. Elegí otra.',
    })
    expect(createPreference).not.toHaveBeenCalled()
  })

  it('devuelve mensaje genérico ante otro error del RPC', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    rpc.mockResolvedValueOnce({ data: null, error: { code: '99999' } })

    const result = await createOrder(['platea-F07-12'])

    expect(result).toEqual({ ok: false, message: 'No se pudo iniciar la reserva. Probá de nuevo.' })
  })

  it('si falla la creación de la preferencia, cancela la orden y avisa', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    rpc.mockResolvedValueOnce({ data: 'order-1', error: null })
    createPreference.mockRejectedValue(new Error('Mercado Pago no respondió'))
    rpc.mockResolvedValueOnce({ data: null, error: null })

    const result = await createOrder(['platea-F07-12'])

    expect(rpc).toHaveBeenNthCalledWith(2, 'cancel_own_order', { p_order_id: 'order-1' })
    expect(result).toEqual({ ok: false, message: 'No se pudo iniciar el pago. Probá de nuevo.' })
  })
})
