import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const { createOrder, refresh } = vi.hoisted(() => ({
  createOrder: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('@/app/actions', () => ({ createOrder }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

import { useReservation } from '@/hooks/useReservation'

beforeEach(() => {
  createOrder.mockReset()
  refresh.mockReset()
  delete (window as { location?: unknown }).location
  ;(window as unknown as { location: Location }).location = { href: '' } as Location
})

describe('useReservation', () => {
  it('arranca en idle', () => {
    const { result } = renderHook(() => useReservation())
    expect(result.current.status).toBe('idle')
    expect(result.current.errorMessage).toBeNull()
  })

  it('en éxito redirige a redirectUrl y no refresca', async () => {
    createOrder.mockResolvedValue({ ok: true, redirectUrl: 'https://mp.example/checkout/abc' })
    const { result } = renderHook(() => useReservation())

    act(() => result.current.confirm(['platea-F07-12']))

    await waitFor(() => expect(window.location.href).toBe('https://mp.example/checkout/abc'))
    expect(createOrder).toHaveBeenCalledWith(['platea-F07-12'])
    expect(refresh).not.toHaveBeenCalled()
  })

  it('en conflicto queda en error con el mensaje y refresca', async () => {
    createOrder.mockResolvedValue({
      ok: false,
      message: 'Alguien reservó una de estas butacas justo antes que vos. Elegí otra.',
    })
    const { result } = renderHook(() => useReservation())

    act(() => result.current.confirm(['platea-F07-12']))

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.errorMessage).toBe(
      'Alguien reservó una de estas butacas justo antes que vos. Elegí otra.',
    )
    expect(refresh).toHaveBeenCalledTimes(1)
  })
})
