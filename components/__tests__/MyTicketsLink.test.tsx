import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MyTicketsLink } from '@/components/MyTicketsLink'

describe('MyTicketsLink', () => {
  it('lleva a Mis entradas', () => {
    render(<MyTicketsLink count={0} />)

    expect(screen.getByRole('link', { name: 'Mis entradas' })).toHaveAttribute('href', '/mis-entradas')
  })

  it('sin entradas no muestra un contador', () => {
    render(<MyTicketsLink count={0} />)

    expect(screen.getByRole('link')).not.toHaveTextContent(/\d/)
  })

  it('con entradas suma la cantidad al nombre y la muestra', () => {
    render(<MyTicketsLink count={3} />)

    const link = screen.getByRole('link', { name: 'Mis entradas, 3 entradas' })
    expect(link).toHaveTextContent('3')
  })

  it('con una sola entrada la nombra en singular', () => {
    render(<MyTicketsLink count={1} />)

    expect(screen.getByRole('link', { name: 'Mis entradas, 1 entrada' })).toBeInTheDocument()
  })

  it('marca la página actual cuando se está en Mis entradas', () => {
    render(<MyTicketsLink count={3} current />)

    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page')
  })

  it('fuera de Mis entradas no marca la página actual', () => {
    render(<MyTicketsLink count={3} />)

    expect(screen.getByRole('link')).not.toHaveAttribute('aria-current')
  })
})
