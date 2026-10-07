import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: { signOut: vi.fn() } }) }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }))

import { MyTickets } from '@/components/MyTickets'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'

const TICKET = {
  orderId: 'o1',
  seats: [{ id: 'platea-F07-12', label: 'Fila 7, butaca 12, Platea B' }],
  total: '$ 38.000',
  date: 'Sábado 5 de diciembre · 21 h',
}

const renderTickets = (tickets = [TICKET], ticketCount = tickets.length) =>
  render(
    <MyTickets
      tickets={tickets}
      ticketCount={ticketCount}
      email="juanchilorenzo@gmail.com"
      avatarUrl={null}
    />,
  )

describe('MyTickets', () => {
  it('muestra el estado vacío con un link para comprar', () => {
    renderTickets([])

    expect(screen.getByText(/todavía no compraste entradas/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /elegir butacas/i })).toHaveAttribute('href', '/')
  })

  it('con entradas, el link vuelve a la lista de funciones', () => {
    renderTickets()

    expect(screen.getByRole('link', { name: 'Volver a las funciones' })).toHaveAttribute('href', '/')
  })

  it('apila una tarjeta por orden', () => {
    renderTickets([TICKET, { ...TICKET, orderId: 'o2' }])

    expect(screen.getAllByRole('article')).toHaveLength(2)
  })

  it('lleva la cabecera del sitio con el nombre de la sala', () => {
    renderTickets()

    expect(screen.getByRole('heading', { level: 1, name: TEATRO_DEL_GLOBO.name })).toBeInTheDocument()
  })

  it('marca Mis entradas como la página actual en la cabecera', () => {
    renderTickets([TICKET], 1)
    const cabecera = screen.getByRole('banner')

    expect(within(cabecera).getByRole('link', { name: 'Mis entradas, 1 entrada' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('sin entradas no muestra en la cabecera el acceso a Mis entradas', () => {
    renderTickets([], 0)
    const cabecera = screen.getByRole('banner')

    expect(within(cabecera).queryByRole('link', { name: /mis entradas/i })).not.toBeInTheDocument()
  })

  it('tiene el título de la página', () => {
    renderTickets([])

    expect(screen.getByRole('heading', { level: 2, name: 'Mis entradas' })).toBeInTheDocument()
  })
})
