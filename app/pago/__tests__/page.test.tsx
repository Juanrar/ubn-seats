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

  it('con una orden pending redirigida a /pago/exito muestra el heading de pendiente, no el de éxito', async () => {
    fetchOrderSummary.mockResolvedValue({ status: 'pending', amount: 38000, seatIds: ['platea-F07-12'] })

    const jsx = await PagoResultadoPage({
      params: Promise.resolve({ resultado: 'exito' }),
      searchParams: Promise.resolve({ external_reference: 'order-1' }),
    })
    render(jsx)

    expect(screen.getByText('Estamos confirmando tu pago')).toBeInTheDocument()
    expect(screen.queryByText('¡Reserva confirmada!')).not.toBeInTheDocument()
  })

  it('con una orden confirmed muestra el heading de éxito', async () => {
    fetchOrderSummary.mockResolvedValue({ status: 'confirmed', amount: 38000, seatIds: ['platea-F07-12'] })

    const jsx = await PagoResultadoPage({
      params: Promise.resolve({ resultado: 'pendiente' }),
      searchParams: Promise.resolve({ external_reference: 'order-1' }),
    })
    render(jsx)

    expect(screen.getByText('¡Reserva confirmada!')).toBeInTheDocument()
  })

  it('con una orden paid_without_seats no dice que el pago se está confirmando ni lista butacas', async () => {
    fetchOrderSummary.mockResolvedValue({ status: 'paid_without_seats', amount: 38000, seatIds: [] })

    const jsx = await PagoResultadoPage({
      params: Promise.resolve({ resultado: 'exito' }),
      searchParams: Promise.resolve({ external_reference: 'order-1' }),
    })
    render(jsx)

    expect(screen.queryByText('Estamos confirmando tu pago')).not.toBeInTheDocument()
    expect(screen.queryByText('Fila 7, butaca 12')).not.toBeInTheDocument()
    expect(screen.getByText('Cobramos el pago, pero las butacas ya no estaban')).toBeInTheDocument()
  })

  it('con un resultado desconocido en la URL llama a notFound', async () => {
    await expect(
      PagoResultadoPage({
        params: Promise.resolve({ resultado: 'desconocido' }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404')

    expect(fetchOrderSummary).not.toHaveBeenCalled()
  })
})
