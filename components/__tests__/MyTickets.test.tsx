import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/app/mis-entradas/actions', () => ({ resendTicket: vi.fn() }))

import { MyTickets } from '@/components/MyTickets'

const TICKET = {
  orderId: 'o1',
  seats: [{ id: 'platea-F07-12', label: 'Fila 7, butaca 12, Platea B' }],
  total: '$ 38.000',
}

describe('MyTickets', () => {
  it('muestra el estado vacío con un link para comprar', () => {
    render(<MyTickets tickets={[]} />)

    expect(screen.getByText(/todavía no compraste entradas/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /elegir butacas/i })).toHaveAttribute('href', '/')
  })

  it('apila una tarjeta por orden', () => {
    render(<MyTickets tickets={[TICKET, { ...TICKET, orderId: 'o2' }]} />)

    expect(screen.getAllByRole('article')).toHaveLength(2)
  })

  it('con entradas, ofrece volver al mapa', () => {
    render(<MyTickets tickets={[TICKET]} />)

    expect(screen.getByRole('link', { name: /volver al mapa/i })).toHaveAttribute('href', '/')
  })

  it('tiene el título de la página', () => {
    render(<MyTickets tickets={[]} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Mis entradas' })).toBeInTheDocument()
  })
})
