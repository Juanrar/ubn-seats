import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const { fetchOrderSummary } = vi.hoisted(() => ({ fetchOrderSummary: vi.fn() }))

vi.mock('@/utils/supabase/server', () => ({ createClient: async () => ({}) }))
vi.mock('@/utils/orders', () => ({ fetchOrderSummary }))

import PagoResultadoPage from '@/app/pago/[resultado]/page'

beforeEach(() => {
  fetchOrderSummary.mockReset()
})

describe('PagoResultadoPage', () => {
  it('muestra el heading de éxito y el resumen de la orden', async () => {
    fetchOrderSummary.mockResolvedValue({ status: 'confirmed', amount: 38000, seatIds: ['platea-F07-12'] })

    const jsx = await PagoResultadoPage({
      params: Promise.resolve({ resultado: 'exito' }),
      searchParams: Promise.resolve({ external_reference: 'order-1' }),
    })
    render(jsx)

    expect(screen.getByText('¡Reserva confirmada!')).toBeInTheDocument()
    expect(screen.getByText('$ 38.000')).toBeInTheDocument()
  })

  it('muestra el heading de pendiente sin resumen si no hay orden', async () => {
    fetchOrderSummary.mockResolvedValue(null)

    const jsx = await PagoResultadoPage({
      params: Promise.resolve({ resultado: 'pendiente' }),
      searchParams: Promise.resolve({}),
    })
    render(jsx)

    expect(screen.getByText('Estamos confirmando tu pago')).toBeInTheDocument()
  })

  it('muestra el heading de error', async () => {
    fetchOrderSummary.mockResolvedValue(null)

    const jsx = await PagoResultadoPage({
      params: Promise.resolve({ resultado: 'error' }),
      searchParams: Promise.resolve({}),
    })
    render(jsx)

    expect(screen.getByText('No se pudo procesar el pago')).toBeInTheDocument()
  })
})
