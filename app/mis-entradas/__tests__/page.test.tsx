import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const { getUser, fetchMyOrders, redirect } = vi.hoisted(() => ({
  getUser: vi.fn(),
  fetchMyOrders: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`)
  }),
}))

vi.mock('@/utils/supabase/server', () => ({ createClient: async () => ({ auth: { getUser } }) }))
vi.mock('@/utils/tickets/myOrders', () => ({ fetchMyOrders }))
vi.mock('next/navigation', () => ({ redirect }))
vi.mock('@/components/MyTickets', () => ({
  MyTickets: ({
    tickets,
    ticketCount,
    email,
  }: {
    tickets: unknown[]
    ticketCount: number
    email: string
  }) => (
    <p>
      {tickets.length} órdenes, {ticketCount} entradas de {email}
    </p>
  ),
}))

import MisEntradas from '@/app/mis-entradas/page'

const PERFORMANCE = { id: 'a', startsAt: '2026-12-06T00:00:00+00:00' }

beforeEach(() => {
  getUser.mockReset()
  fetchMyOrders.mockReset()
  redirect.mockClear()
})

describe('MisEntradas', () => {
  it('sin sesión vuelve a la portada', async () => {
    getUser.mockResolvedValue({ data: { user: null } })

    await expect(MisEntradas()).rejects.toThrow('redirect:/')
    expect(fetchMyOrders).not.toHaveBeenCalled()
  })

  it('pasa las órdenes, la cantidad de entradas y el mail del usuario', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'a@test', user_metadata: {} } } })
    fetchMyOrders.mockResolvedValue([
      { orderId: 'o1', amount: 2, seatIds: ['platea-F07-11', 'platea-F07-13'], createdAt: '', performance: PERFORMANCE },
      { orderId: 'o2', amount: 1, seatIds: ['platea-F10-4'], createdAt: '', performance: PERFORMANCE },
    ])

    render(await MisEntradas())

    expect(screen.getByText('2 órdenes, 3 entradas de a@test')).toBeInTheDocument()
  })
})
