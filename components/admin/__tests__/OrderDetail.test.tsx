import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderDetail } from '@/components/admin/OrderDetail'
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

function setup(props: Partial<React.ComponentProps<typeof OrderDetail>> = {}) {
  const handlers = { onCancelOrder: vi.fn(), onClose: vi.fn() }
  const utils = render(<OrderDetail order={ORDER} pending={false} {...handlers} {...props} />)
  return { ...handlers, ...utils }
}

describe('OrderDetail', () => {
  it('muestra comprador, monto y butacas', () => {
    setup()
    expect(screen.getByText(/ana@mail.com/)).toBeInTheDocument()
    expect(screen.getByText(/114\.000/)).toBeInTheDocument()
    expect(screen.getByText(/F07-11/)).toBeInTheDocument()
  })

  it('cancelar pide confirmación antes de llamar', async () => {
    const { onCancelOrder } = setup()
    await userEvent.click(screen.getByRole('button', { name: /^cancelar la orden$/i }))
    expect(onCancelOrder).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }))
    expect(onCancelOrder).toHaveBeenCalled()
  })

  it('al confirmar una orden cobrada recuerda devolver la plata a mano', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /^cancelar la orden$/i }))
    expect(screen.getByText(/123456789/)).toBeInTheDocument()
    expect(screen.getByText(/mercado pago/i)).toBeInTheDocument()
  })

  it('una orden pendiente no habla de devolver plata', async () => {
    setup({ order: { ...ORDER, status: 'pending', mpPaymentId: null } })
    await userEvent.click(screen.getByRole('button', { name: /^cancelar la orden$/i }))
    expect(screen.queryByText(/devolv/i)).not.toBeInTheDocument()
  })

  it('cerrar llama a onClose', async () => {
    const { onClose } = setup()
    await userEvent.click(screen.getByRole('button', { name: /^cerrar$/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('abrir otra orden no hereda la confirmación de la anterior', async () => {
    const { rerender } = setup()
    await userEvent.click(screen.getByRole('button', { name: /^cancelar la orden$/i }))
    rerender(
      <OrderDetail
        order={{ ...ORDER, id: '22222222-2222-2222-2222-222222222222' }}
        pending={false}
        onCancelOrder={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: /confirmar/i })).not.toBeInTheDocument()
  })

  it('mientras hay una acción en curso no se puede confirmar la cancelación', async () => {
    const { rerender } = setup()
    await userEvent.click(screen.getByRole('button', { name: /^cancelar la orden$/i }))
    rerender(<OrderDetail order={ORDER} pending onCancelOrder={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeDisabled()
  })
})
