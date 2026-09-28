import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const { getUser, fetchPerformance, fetchOccupiedSeatIds, fetchOwnedSeatIds, redirect } = vi.hoisted(
  () => ({
    getUser: vi.fn(),
    fetchPerformance: vi.fn(),
    fetchOccupiedSeatIds: vi.fn(),
    fetchOwnedSeatIds: vi.fn(),
    redirect: vi.fn((path: string) => {
      throw new Error(`redirect:${path}`)
    }),
  }),
)

vi.mock('@/utils/supabase/server', () => ({ createClient: async () => ({ auth: { getUser } }) }))
vi.mock('@/utils/performances', () => ({ fetchPerformance }))
vi.mock('@/utils/occupancy', () => ({ fetchOccupiedSeatIds, fetchOwnedSeatIds }))
vi.mock('next/navigation', () => ({ redirect }))
vi.mock('@/components/PlateaPicker', () => ({
  PlateaPicker: ({ performance, occupied }: { performance: { id: string }; occupied: Set<string> }) => (
    <p>
      selector {performance.id} con {occupied.size} ocupadas
    </p>
  ),
}))

import PerformancePage from '@/app/funciones/[performanceId]/page'

const ID = 'a82bd4e0-937c-4af5-a5c8-259a7f942c68'
const FUTURA = { id: ID, startsAt: '2999-12-06T00:00:00+00:00' }
const PASADA = { id: ID, startsAt: '2000-12-06T00:00:00+00:00' }

const renderPage = async (performanceId = ID) =>
  render(await PerformancePage({ params: Promise.resolve({ performanceId }) }))

beforeEach(() => {
  getUser.mockReset()
  fetchPerformance.mockReset()
  fetchOccupiedSeatIds.mockReset()
  fetchOwnedSeatIds.mockReset()
  redirect.mockClear()
  getUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'a@test', user_metadata: {} } } })
  fetchOccupiedSeatIds.mockResolvedValue(new Set(['platea-F07-12']))
  fetchOwnedSeatIds.mockResolvedValue(new Set())
})

describe('PerformancePage', () => {
  it('muestra el selector con la ocupación de la función', async () => {
    fetchPerformance.mockResolvedValue(FUTURA)

    await renderPage()

    expect(screen.getByText(`selector ${ID} con 1 ocupadas`)).toBeInTheDocument()
    expect(fetchOccupiedSeatIds).toHaveBeenCalledWith(expect.anything(), ID)
    expect(fetchOwnedSeatIds).toHaveBeenCalledWith(expect.anything(), 'user-1', ID)
  })

  it('sin sesión vuelve al inicio', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    await expect(renderPage()).rejects.toThrow('redirect:/')
    expect(fetchPerformance).not.toHaveBeenCalled()
  })

  it('si la función no existe vuelve a la lista', async () => {
    fetchPerformance.mockResolvedValue(null)
    await expect(renderPage()).rejects.toThrow('redirect:/')
    expect(fetchOccupiedSeatIds).not.toHaveBeenCalled()
  })

  it('si la función ya empezó vuelve a la lista', async () => {
    fetchPerformance.mockResolvedValue(PASADA)
    await expect(renderPage()).rejects.toThrow('redirect:/')
    expect(fetchOccupiedSeatIds).not.toHaveBeenCalled()
  })
})
