import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AdminOrder } from '@/utils/admin/orders'

const cancelOrder = vi.hoisted(() => vi.fn())
vi.mock('@/app/admin/actions', () => ({ cancelOrder }))

import { OrdersList } from '@/components/admin/OrdersList'

const BASE: AdminOrder = {
  id: '11111111-1111-1111-1111-111111111111',
  status: 'confirmed',
  amount: 114000,
  createdAt: '2026-09-10T18:00:00Z',
  mpPaymentId: '123456789',
  ticketSentAt: null,
  email: 'ana@mail.com',
  seatIds: ['platea-F07-11'],
}

const ORDERS: AdminOrder[] = [
  BASE,
  { ...BASE, id: '22222222-2222-2222-2222-222222222222', email: 'lucia@otro.com', status: 'pending' },
]

describe('OrdersList', () => {
  it('lista todas las órdenes con mail y estado', () => {
    render(<OrdersList orders={ORDERS} />)
    expect(screen.getByRole('button', { name: /ana@mail.com.*pagada/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /lucia@otro.com.*pendiente/i })).toBeInTheDocument()
  })

  it('filtra por mail mientras se escribe', async () => {
    render(<OrdersList orders={ORDERS} />)
    await userEvent.type(screen.getByLabelText(/buscar por mail/i), 'lucia')
    expect(screen.queryByRole('button', { name: /ana@mail.com/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /lucia@otro.com/i })).toBeInTheDocument()
  })

  it('avisa cuando ningún mail coincide', async () => {
    render(<OrdersList orders={ORDERS} />)
    await userEvent.type(screen.getByLabelText(/buscar por mail/i), 'nadie')
    expect(screen.getByText(/no hay órdenes con ese mail/i)).toBeInTheDocument()
  })

  it('tocar una orden abre su detalle y cerrar vuelve a la lista', async () => {
    render(<OrdersList orders={ORDERS} />)
    await userEvent.click(screen.getByRole('button', { name: /ana@mail.com/i }))
    expect(screen.getByRole('button', { name: /^cancelar la orden$/i })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^cerrar$/i }))
    expect(screen.getByLabelText(/buscar por mail/i)).toBeInTheDocument()
  })

  it('confirmar la cancelación llama al server action y anuncia el resultado', async () => {
    cancelOrder.mockResolvedValue({ ok: true, count: 1, message: 'Cancelaste la orden y liberaste 1 butaca.' })
    render(<OrdersList orders={ORDERS} />)
    await userEvent.click(screen.getByRole('button', { name: /ana@mail.com/i }))
    await userEvent.click(screen.getByRole('button', { name: /^cancelar la orden$/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }))
    expect(cancelOrder).toHaveBeenCalledWith(BASE.id)
    expect(await screen.findByRole('status')).toHaveTextContent(/cancelaste la orden/i)
  })

  it('sin órdenes lo dice', () => {
    render(<OrdersList orders={[]} />)
    expect(screen.getByText(/todavía no hay órdenes/i)).toBeInTheDocument()
  })

  it('la región de estado sigue en el árbol de accesibilidad sin mensaje', () => {
    render(<OrdersList orders={ORDERS} />)
    const region = screen.getByRole('status')
    expect(region).toBeInTheDocument()
    expect(region).not.toHaveAttribute('hidden')
    expect(region.className).not.toMatch(/empty:hidden/)
  })
})
