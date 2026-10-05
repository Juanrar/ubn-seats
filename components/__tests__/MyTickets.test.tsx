import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MyTickets } from '@/components/MyTickets'

const TICKET = {
  orderId: 'o1',
  seats: [{ id: 'platea-F07-12', label: 'Fila 7, butaca 12, Platea B' }],
  total: '$ 38.000',
  date: 'Sábado 5 de diciembre · 21 h',
}

describe('MyTickets', () => {
  it('muestra el estado vacío con un link para comprar', () => {
    render(<MyTickets tickets={[]} />)

    expect(screen.getByText(/todavía no compraste entradas/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /elegir butacas/i })).toHaveAttribute('href', '/')
  })

  it('con entradas, el link vuelve a la lista de funciones', () => {
    render(<MyTickets tickets={[TICKET]} />)

    expect(screen.getByRole('link', { name: 'Volver a las funciones' })).toHaveAttribute('href', '/')
  })

  it('apila una tarjeta por orden', () => {
    render(<MyTickets tickets={[TICKET, { ...TICKET, orderId: 'o2' }]} />)

    expect(screen.getAllByRole('article')).toHaveLength(2)
  })

  it('tiene el título de la página', () => {
    render(<MyTickets tickets={[]} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Mis entradas' })).toBeInTheDocument()
  })
})
