import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const { reserveSeats, refresh } = vi.hoisted(() => ({
  reserveSeats: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('@/app/actions', () => ({ reserveSeats }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

import { useReservation } from '@/hooks/useReservation'

beforeEach(() => {
  reserveSeats.mockReset()
  refresh.mockReset()
})

describe('useReservation', () => {
  it('arranca en idle', () => {
    const { result } = renderHook(() => useReservation(vi.fn()))
    expect(result.current.status).toBe('idle')
    expect(result.current.errorMessage).toBeNull()
  })

  it('en éxito vuelve a idle, refresca y llama onSettled', async () => {
    reserveSeats.mockResolvedValue({ ok: true })
    const onSettled = vi.fn()
    const { result } = renderHook(() => useReservation(onSettled))

    act(() => result.current.confirm(['platea-F07-12']))

    await waitFor(() => expect(result.current.status).toBe('idle'))
    expect(reserveSeats).toHaveBeenCalledWith(['platea-F07-12'])
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(onSettled).toHaveBeenCalledTimes(1)
  })

  it('en conflicto queda en error con el mensaje, refresca y llama onSettled', async () => {
    reserveSeats.mockResolvedValue({ ok: false, message: 'Alguien reservó una de estas butacas justo antes que vos. Elegí otra.' })
    const onSettled = vi.fn()
    const { result } = renderHook(() => useReservation(onSettled))

    act(() => result.current.confirm(['platea-F07-12']))

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.errorMessage).toBe(
      'Alguien reservó una de estas butacas justo antes que vos. Elegí otra.',
    )
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(onSettled).toHaveBeenCalledTimes(1)
  })
})
