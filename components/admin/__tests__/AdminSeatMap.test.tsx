import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { blockSeats, unblockSeats, cancelOrder, loadOrder } = vi.hoisted(() => ({
  blockSeats: vi.fn(),
  unblockSeats: vi.fn(),
  cancelOrder: vi.fn(),
  loadOrder: vi.fn(),
}))

vi.mock('@/app/admin/actions', () => ({ blockSeats, unblockSeats, cancelOrder, loadOrder }))

import { AdminSeatMap } from '@/components/admin/AdminSeatMap'
import type { SeatOccupancy } from '@/lib/admin/seatState'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'

const venue = buildVenue(TEATRO_DEL_GLOBO)
const firstSeat = venue.seats[0]
const soldSeat = venue.seats[1]

function labelPattern(label: string): RegExp {
  return new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},`, 'i')
}

function renderMap(entries: [string, SeatOccupancy][] = []) {
  render(<AdminSeatMap occupancy={new Map(entries)} />)
}

describe('AdminSeatMap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    blockSeats.mockResolvedValue({ ok: true, count: 1, message: 'Bloqueaste 1 butaca.' })
    unblockSeats.mockResolvedValue({ ok: true, count: 1, message: 'Liberaste 1 butaca.' })
    cancelOrder.mockResolvedValue({ ok: true, count: 2, message: 'Cancelaste la orden.' })
    loadOrder.mockResolvedValue(null)
  })

  it('pinta las 302 butacas', () => {
    renderMap()
    expect(screen.getAllByRole('button', { name: /fila/i })).toHaveLength(302)
  })

  it('es una sola parada de tabulación', () => {
    renderMap()
    const alcanzables = screen
      .getAllByRole('button', { name: /fila/i })
      .filter((b) => b.getAttribute('tabindex') === '0')
    expect(alcanzables).toHaveLength(1)
  })

  it('una butaca bloqueada se anuncia como bloqueada', () => {
    renderMap([[firstSeat.id, { status: 'blocked', orderId: null }]])
    expect(
      screen.getByRole('button', { name: new RegExp(`${labelPattern(firstSeat.label).source}.*bloqueada`, 'i') }),
    ).toBeInTheDocument()
  })

  it('elegir una libre ofrece bloquearla, y al confirmar llama a la acción', async () => {
    renderMap()
    await userEvent.click(screen.getByRole('button', { name: labelPattern(firstSeat.label) }))

    const boton = await screen.findByRole('button', { name: /bloquear 1 butaca/i })
    await userEvent.click(boton)

    expect(blockSeats).toHaveBeenCalledWith([firstSeat.id])
    expect(await screen.findByText(/bloqueaste 1 butaca/i)).toBeInTheDocument()
  })

  it('tocar una vendida carga y muestra su orden', async () => {
    loadOrder.mockResolvedValue({
      id: 'o1',
      status: 'confirmed',
      amount: 114000,
      createdAt: '2026-09-10T18:00:00Z',
      mpPaymentId: '999',
      ticketSentAt: null,
      email: 'ana@mail.com',
      seatIds: [soldSeat.id],
    })

    renderMap([[soldSeat.id, { status: 'confirmed', orderId: 'o1' }]])
    await userEvent.click(screen.getByRole('button', { name: labelPattern(soldSeat.label) }))

    expect(loadOrder).toHaveBeenCalledWith('o1')
    expect(await screen.findByText(/ana@mail.com/)).toBeInTheDocument()
  })

  it('al pasar a otra orden no muestra la anterior mientras carga la nueva', async () => {
    const otherSold = venue.seats[2]
    let resolveSecond: (value: unknown) => void = () => {}
    loadOrder
      .mockResolvedValueOnce({
        id: 'o1', status: 'confirmed', amount: 114000, createdAt: '2026-09-10T18:00:00Z',
        mpPaymentId: '999', ticketSentAt: null, email: 'ana@mail.com', seatIds: [soldSeat.id],
      })
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve }))

    renderMap([
      [soldSeat.id, { status: 'confirmed', orderId: 'o1' }],
      [otherSold.id, { status: 'confirmed', orderId: 'o2' }],
    ])

    await userEvent.click(screen.getByRole('button', { name: labelPattern(soldSeat.label) }))
    expect(await screen.findByText(/ana@mail.com/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: labelPattern(otherSold.label) }))
    expect(screen.queryByText(/ana@mail.com/)).not.toBeInTheDocument()
    resolveSecond(null)
  })
})
