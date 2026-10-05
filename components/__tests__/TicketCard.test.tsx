import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TicketCard } from '@/components/TicketCard'
import { SHOW } from '@/lib/show'

const TICKET = {
  orderId: 'o1',
  seats: [
    { id: 'platea-F07-12', label: 'Fila 7, butaca 12, Platea B' },
    { id: 'platea-F07-13', label: 'Fila 7, butaca 13, Platea B' },
  ],
  total: '$ 76.000',
  date: 'Sábado 5 de diciembre · 21 h',
}

describe('TicketCard', () => {
  it('muestra la función, las butacas y el total', () => {
    render(<TicketCard ticket={TICKET} />)

    expect(screen.getByText(SHOW.title)).toBeInTheDocument()
    expect(screen.getByText('Sábado 5 de diciembre · 21 h')).toBeInTheDocument()
    expect(screen.getByText('Fila 7, butaca 12, Platea B')).toBeInTheDocument()
    expect(screen.getByText('Fila 7, butaca 13, Platea B')).toBeInTheDocument()
    expect(screen.getByText('$ 76.000')).toBeInTheDocument()
  })

  it('enlaza la descarga a la ruta de la orden', () => {
    render(<TicketCard ticket={TICKET} />)

    expect(screen.getByRole('link', { name: /descargar/i })).toHaveAttribute(
      'href',
      '/api/entradas/o1',
    )
  })

  it('la descarga es la única acción de la tarjeta', () => {
    render(<TicketCard ticket={TICKET} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })
})
