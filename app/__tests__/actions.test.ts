import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'
import { MAX_SEATS } from '@/lib/constants'

const { getUser, rpc, createPreference, requireAccessToken, fetchPerformance } = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  createPreference: vi.fn(),
  requireAccessToken: vi.fn(),
  fetchPerformance: vi.fn(),
}))

vi.mock('@/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    rpc,
  }),
}))
vi.mock('@/utils/mercadopago/client', () => ({ createPreference }))
vi.mock('@/utils/performances', () => ({ fetchPerformance }))
vi.mock('@/utils/mercadopago/account', () => ({
  requireAccessToken,
  NoConnectedAccountError: class NoConnectedAccountError extends Error {},
}))

import { createOrder } from '@/app/actions'

const seatIds = buildVenue(TEATRO_DEL_GLOBO).seats.map((seat) => seat.id)

const SITE_URL = 'https://butacas.test'
const PERFORMANCE_ID = 'a82bd4e0-937c-4af5-a5c8-259a7f942c68'
const SABADO = { id: PERFORMANCE_ID, startsAt: '2026-12-06T00:00:00+00:00' }
const NOW = new Date('2026-11-01T12:00:00Z')

beforeEach(() => {
  getUser.mockReset()
  rpc.mockReset()
  createPreference.mockReset()
  requireAccessToken.mockReset()
  requireAccessToken.mockResolvedValue('APP_USR-token')
  fetchPerformance.mockReset()
  fetchPerformance.mockResolvedValue(SABADO)
  process.env.SITE_URL = SITE_URL
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createOrder', () => {
  it('rechaza sin sesión', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    const result = await createOrder(PERFORMANCE_ID, ['platea-F07-12'])
    expect(result).toEqual({ ok: false, message: 'Iniciá sesión para reservar.' })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('rechaza un array vacío sin llamar al RPC', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const result = await createOrder(PERFORMANCE_ID, [])
    expect(result).toEqual({ ok: false, message: 'Selección inválida.' })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('rechaza más butacas que MAX_SEATS sin llamar al RPC', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const result = await createOrder(PERFORMANCE_ID, seatIds.slice(0, MAX_SEATS + 1))
    expect(result).toEqual({ ok: false, message: 'Selección inválida.' })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('rechaza una butaca que no existe en el catálogo sin llamar al RPC', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const result = await createOrder(PERFORMANCE_ID, ['not-a-real-seat'])
    expect(result).toEqual({ ok: false, message: 'Selección inválida.' })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('rechaza una función que no existe sin llamar al RPC', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    fetchPerformance.mockResolvedValue(null)

    const result = await createOrder(PERFORMANCE_ID, ['platea-F07-12'])

    expect(result).toEqual({ ok: false, message: 'Esta función ya no está a la venta.' })
    expect(fetchPerformance).toHaveBeenCalledWith(expect.anything(), PERFORMANCE_ID)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('rechaza una función que ya empezó sin llamar al RPC', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    fetchPerformance.mockResolvedValue({ id: PERFORMANCE_ID, startsAt: '2026-10-31T23:00:00Z' })

    const result = await createOrder(PERFORMANCE_ID, ['platea-F07-12'])

    expect(result).toEqual({ ok: false, message: 'Esta función ya no está a la venta.' })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('no crea la orden si no hay una cuenta de Mercado Pago vinculada', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const { NoConnectedAccountError } = await import('@/utils/mercadopago/account')
    requireAccessToken.mockRejectedValue(new NoConnectedAccountError())

    const result = await createOrder(PERFORMANCE_ID, ['platea-F07-12'])

    expect(result).toEqual({ ok: false, message: 'La venta no está habilitada todavía.' })
    expect(rpc).not.toHaveBeenCalled()
    expect(createPreference).not.toHaveBeenCalled()
  })

  it('devuelve mensaje genérico si falla la resolución del token por otra razón', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    requireAccessToken.mockRejectedValue(new Error('la base no respondió'))

    const result = await createOrder(PERFORMANCE_ID, ['platea-F07-12'])

    expect(result).toEqual({ ok: false, message: 'No se pudo iniciar el pago. Probá de nuevo.' })
    expect(rpc).not.toHaveBeenCalled()
    expect(createPreference).not.toHaveBeenCalled()
  })

  it('cobra el total exacto del catálogo, no lo que mande el cliente', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    rpc.mockResolvedValue({ data: 'order-1', error: null })
    createPreference.mockResolvedValue({
      initPoint: 'https://mp.example/checkout/abc',
      preferenceId: 'pref-1',
    })

    const selection = ['platea-F02-1', 'platea-F07-12', 'platea-F14-3']
    await createOrder(PERFORMANCE_ID, selection)

    expect(rpc).toHaveBeenNthCalledWith(1, 'create_order', {
      p_performance_id: PERFORMANCE_ID,
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

    const result = await createOrder(PERFORMANCE_ID, ['platea-F02-1', 'platea-F07-12'])

    expect(rpc).toHaveBeenNthCalledWith(1, 'create_order', {
      p_performance_id: PERFORMANCE_ID,
      p_seat_ids: ['platea-F02-1', 'platea-F07-12'],
      p_amount: 3,
    })
    expect(createPreference).toHaveBeenCalledWith({
      orderId: 'order-1',
      items: [
        {
          id: 'platea-F02-1',
          title: 'Fila 2, butaca 1, Platea A · Sábado 5 de diciembre · 21 h',
          quantity: 1,
          unit_price: 1,
          currency_id: 'ARS',
        },
        {
          id: 'platea-F07-12',
          title: 'Fila 7, butaca 12, Platea B · Sábado 5 de diciembre · 21 h',
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
      accessToken: 'APP_USR-token',
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

    await createOrder(PERFORMANCE_ID, ['platea-F07-12'])

    expect(rpc).toHaveBeenNthCalledWith(2, 'set_order_preference', {
      p_order_id: 'order-1',
      p_preference_id: 'pref-1',
    })
  })

  it('falla ruidosamente si falta SITE_URL, sin tocar la base', async () => {
    delete process.env.SITE_URL
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    await expect(createOrder(PERFORMANCE_ID, ['platea-F07-12'])).rejects.toThrow('SITE_URL')
    expect(rpc).not.toHaveBeenCalled()
  })

  it('devuelve mensaje de conflicto si el RPC choca con el índice único (23505)', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    rpc.mockResolvedValueOnce({ data: null, error: { code: '23505' } })

    const result = await createOrder(PERFORMANCE_ID, ['platea-F07-12'])

    expect(result).toEqual({
      ok: false,
      message: 'Alguien reservó una de estas butacas justo antes que vos. Elegí otra.',
    })
    expect(createPreference).not.toHaveBeenCalled()
  })

  it('devuelve mensaje genérico ante otro error del RPC', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    rpc.mockResolvedValueOnce({ data: null, error: { code: '99999' } })

    const result = await createOrder(PERFORMANCE_ID, ['platea-F07-12'])

    expect(result).toEqual({ ok: false, message: 'No se pudo iniciar la reserva. Probá de nuevo.' })
  })

  it('si falla la creación de la preferencia, cancela la orden y avisa', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    rpc.mockResolvedValueOnce({ data: 'order-1', error: null })
    createPreference.mockRejectedValue(new Error('Mercado Pago no respondió'))
    rpc.mockResolvedValueOnce({ data: null, error: null })

    const result = await createOrder(PERFORMANCE_ID, ['platea-F07-12'])

    expect(rpc).toHaveBeenNthCalledWith(2, 'cancel_own_order', { p_order_id: 'order-1' })
    expect(result).toEqual({ ok: false, message: 'No se pudo iniciar el pago. Probá de nuevo.' })
  })
})
