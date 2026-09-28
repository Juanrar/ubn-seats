import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const { getUser, fetchPerformancesOnSale } = vi.hoisted(() => ({
  getUser: vi.fn(),
  fetchPerformancesOnSale: vi.fn(),
}))

vi.mock('@/utils/supabase/server', () => ({ createClient: async () => ({ auth: { getUser } }) }))
vi.mock('@/utils/performances', () => ({ fetchPerformancesOnSale }))
vi.mock('@/components/LoginScreen', () => ({ LoginScreen: () => <p>pantalla de login</p> }))
vi.mock('@/components/PerformanceList', () => ({
  PerformanceList: ({ performances }: { performances: { id: string }[] }) => (
    <p>lista con {performances.length} funciones</p>
  ),
}))

import Home from '@/app/page'

beforeEach(() => {
  getUser.mockReset()
  fetchPerformancesOnSale.mockReset()
})

describe('Home', () => {
  it('sin sesión muestra el login', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    render(await Home())
    expect(screen.getByText('pantalla de login')).toBeInTheDocument()
    expect(fetchPerformancesOnSale).not.toHaveBeenCalled()
  })

  it('con sesión muestra las funciones a la venta', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'a@test', user_metadata: {} } } })
    fetchPerformancesOnSale.mockResolvedValue([
      { id: 'a', startsAt: '2026-12-06T00:00:00+00:00' },
      { id: 'b', startsAt: '2026-12-08T00:00:00+00:00' },
    ])

    render(await Home())

    expect(screen.getByText('lista con 2 funciones')).toBeInTheDocument()
  })
})
