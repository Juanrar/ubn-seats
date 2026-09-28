import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const { getConnectedAccount, fetchAdminSeatMap, fetchAllPerformances } = vi.hoisted(() => ({
  getConnectedAccount: vi.fn(),
  fetchAdminSeatMap: vi.fn(),
  fetchAllPerformances: vi.fn(),
}))

vi.mock('@/utils/mercadopago/account', () => ({ getConnectedAccount }))
vi.mock('@/utils/admin/seats', () => ({ fetchAdminSeatMap }))
vi.mock('@/utils/performances', () => ({ fetchAllPerformances }))
vi.mock('@/utils/supabase/service', () => ({ createServiceClient: () => ({}) }))
vi.mock('@/components/admin/AdminSeatMap', () => ({
  AdminSeatMap: ({ performanceId }: { performanceId: string }) => <p>mapa de {performanceId}</p>,
}))

import SeatsPage from '@/app/admin/(panel)/page'

const SABADO = { id: 'a82bd4e0-937c-4af5-a5c8-259a7f942c68', startsAt: '2999-12-06T00:00:00+00:00' }
const LUNES = { id: 'b93ce5f1-a48d-4bf6-b6d9-36a8b053d79a', startsAt: '2999-12-08T00:00:00+00:00' }

const renderPage = async (funcion?: string) =>
  render(await SeatsPage({ searchParams: Promise.resolve(funcion ? { funcion } : {}) }))

beforeEach(() => {
  vi.clearAllMocks()
  getConnectedAccount.mockResolvedValue({ userId: 'mp-1' })
  fetchAdminSeatMap.mockResolvedValue(new Map())
  fetchAllPerformances.mockResolvedValue([SABADO, LUNES])
})

describe('SeatsPage', () => {
  it('sin función elegida muestra la próxima', async () => {
    await renderPage()

    expect(screen.getByText(`mapa de ${SABADO.id}`)).toBeInTheDocument()
    expect(fetchAdminSeatMap).toHaveBeenCalledWith(expect.anything(), SABADO.id)
    const pestaña = screen
      .getAllByRole('link')
      .find((link) => link.getAttribute('href') === `/admin?funcion=${SABADO.id}`)
    expect(pestaña).toHaveAttribute('aria-current', 'page')
  })

  it('muestra la función que pide la URL', async () => {
    await renderPage(LUNES.id)

    expect(screen.getByText(`mapa de ${LUNES.id}`)).toBeInTheDocument()
    expect(fetchAdminSeatMap).toHaveBeenCalledWith(expect.anything(), LUNES.id)
  })

  it('ignora una función que no existe y cae en la próxima', async () => {
    await renderPage('b93ce5f1-0000-0000-0000-36a8b053d79a')

    expect(screen.getByText(`mapa de ${SABADO.id}`)).toBeInTheDocument()
  })

  it('sin funciones cargadas lo dice y no pide el mapa', async () => {
    fetchAllPerformances.mockResolvedValue([])

    await renderPage()

    expect(screen.getByText('No hay funciones cargadas.')).toBeInTheDocument()
    expect(fetchAdminSeatMap).not.toHaveBeenCalled()
  })
})
