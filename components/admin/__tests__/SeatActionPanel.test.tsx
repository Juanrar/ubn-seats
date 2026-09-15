import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SeatActionPanel } from '@/components/admin/SeatActionPanel'
import type { AdminOrder } from '@/utils/admin/orders'

const ORDER: AdminOrder = {
  id: '11111111-1111-1111-1111-111111111111',
  status: 'confirmed',
  amount: 114000,
  createdAt: '2026-09-10T18:00:00Z',
  mpPaymentId: '123456789',
  ticketSentAt: '2026-09-10T18:01:00Z',
  email: 'ana@mail.com',
  seatIds: ['platea-F07-11', 'platea-F07-12'],
}

function setup(props: Partial<React.ComponentProps<typeof SeatActionPanel>> = {}) {
  const handlers = {
    onBlock: vi.fn(),
    onUnblock: vi.fn(),
    onClear: vi.fn(),
    onCancelOrder: vi.fn(),
    onCloseOrder: vi.fn(),
  }
  render(
    <SeatActionPanel
      action="none"
      selectedCount={0}
      order={null}
      message={null}
      pending={false}
      {...handlers}
      {...props}
    />,
  )
  return handlers
}

describe('SeatActionPanel', () => {
  it('sin selección ni orden explica qué hacer', () => {
    setup()
    expect(screen.getByText(/elegí/i)).toBeInTheDocument()
  })

  it('con libres elegidas ofrece bloquearlas y dice cuántas', async () => {
    const { onBlock } = setup({ action: 'block', selectedCount: 4 })
    const boton = screen.getByRole('button', { name: /bloquear 4 butacas/i })
    await userEvent.click(boton)
    expect(onBlock).toHaveBeenCalled()
  })

  it('con bloqueadas elegidas ofrece liberarlas', async () => {
    const { onUnblock } = setup({ action: 'unblock', selectedCount: 2 })
    await userEvent.click(screen.getByRole('button', { name: /liberar 2 butacas/i }))
    expect(onUnblock).toHaveBeenCalled()
  })

  it('con una selección mezclada avisa y no ofrece acción', () => {
    setup({ action: 'mixed', selectedCount: 3 })
    expect(screen.getByRole('alert')).toHaveTextContent(/mezcl/i)
    expect(screen.queryByRole('button', { name: /bloquear/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /liberar/i })).not.toBeInTheDocument()
  })

  it('con una selección mezclada deshacer la selección llama a onClear', async () => {
    const { onClear } = setup({ action: 'mixed', selectedCount: 3 })
    await userEvent.click(screen.getByRole('button', { name: /deshacer la selección/i }))
    expect(onClear).toHaveBeenCalled()
  })

  it('con una orden abierta muestra su detalle en lugar de las acciones de selección', () => {
    setup({ order: ORDER, action: 'block', selectedCount: 2 })
    expect(screen.getByText(/ana@mail.com/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /bloquear/i })).not.toBeInTheDocument()
  })

  it('el mensaje del resultado se anuncia en una región viva', () => {
    setup({ message: 'Bloqueaste 4 butacas.' })
    const region = screen.getByRole('status')
    expect(region).toHaveTextContent('Bloqueaste 4 butacas.')
    expect(region).toHaveAttribute('aria-live', 'polite')
  })

  it('mientras hay una acción en curso los botones no se pueden apretar', () => {
    setup({ action: 'block', selectedCount: 2, pending: true })
    expect(screen.getByRole('button', { name: /bloquear 2 butacas/i })).toBeDisabled()
  })
})
