import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const { getUser, fetchPerformancesOnSale, fetchMyOrders } = vi.hoisted(() => ({
  getUser: vi.fn(),
  fetchPerformancesOnSale: vi.fn(),
  fetchMyOrders: vi.fn(),
}))

vi.mock('@/utils/supabase/server', () => ({ createClient: async () => ({ auth: { getUser } }) }))
vi.mock('@/utils/performances', () => ({ fetchPerformancesOnSale }))
vi.mock('@/utils/tickets/myOrders', () => ({ fetchMyOrders }))
vi.mock('@/components/LoginScreen', () => ({ LoginScreen: () => <p>pantalla de login</p> }))
vi.mock('@/components/PerformanceList', () => ({
  PerformanceList: ({
    performances,
    ticketCount,
  }: {
    performances: { id: string }[]
    ticketCount: number
  }) => (
    <p>
      lista con {performances.length} funciones y {ticketCount} entradas
    </p>
  ),
}))

import Home from '@/app/page'

const PERFORMANCE = { id: 'a', startsAt: '2026-12-06T00:00:00+00:00' }

beforeEach(() => {
  getUser.mockReset()
  fetchPerformancesOnSale.mockReset()
  fetchMyOrders.mockReset()
  fetchMyOrders.mockResolvedValue([])
})

describe('Home', () => {
  it('sin sesión muestra el login', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    render(await Home())
    expect(screen.getByText('pantalla de login')).toBeInTheDocument()
    expect(fetchPerformancesOnSale).not.toHaveBeenCalled()
    expect(fetchMyOrders).not.toHaveBeenCalled()
  })

  it('con sesión muestra las funciones a la venta', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'a@test', user_metadata: {} } } })
    fetchPerformancesOnSale.mockResolvedValue([
      PERFORMANCE,
      { id: 'b', startsAt: '2026-12-08T00:00:00+00:00' },
    ])

    render(await Home())

    expect(screen.getByText('lista con 2 funciones y 0 entradas')).toBeInTheDocument()
  })

  it('cuenta una entrada por cada butaca comprada', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'a@test', user_metadata: {} } } })
    fetchPerformancesOnSale.mockResolvedValue([PERFORMANCE])
    fetchMyOrders.mockResolvedValue([
      { orderId: 'o1', amount: 2, seatIds: ['platea-F07-11', 'platea-F07-13'], createdAt: '', performance: PERFORMANCE },
      { orderId: 'o2', amount: 1, seatIds: ['platea-F10-4'], createdAt: '', performance: PERFORMANCE },
    ])

    render(await Home())

    expect(screen.getByText('lista con 1 funciones y 3 entradas')).toBeInTheDocument()
  })
})
