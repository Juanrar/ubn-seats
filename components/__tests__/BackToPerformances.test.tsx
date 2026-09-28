import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }))

import { BackToPerformances } from '@/components/BackToPerformances'

const SABADO = { id: 'a82bd4e0-937c-4af5-a5c8-259a7f942c68', startsAt: '2026-12-06T00:00:00+00:00' }

beforeEach(() => {
  push.mockReset()
})

describe('BackToPerformances', () => {
  it('es un link a la lista de funciones', () => {
    render(<BackToPerformances selectionCount={0} performance={SABADO} />)
    expect(screen.getByRole('link', { name: 'Volver a las funciones' })).toHaveAttribute('href', '/')
  })

  it('sin butacas elegidas navega sin preguntar', () => {
    render(<BackToPerformances selectionCount={0} performance={SABADO} />)
    const click = fireEvent.click(screen.getByRole('link', { name: 'Volver a las funciones' }))

    expect(click).toBe(true)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('con butacas elegidas frena la navegación y avisa que se pierde la selección', () => {
    render(<BackToPerformances selectionCount={3} performance={SABADO} />)
    const click = fireEvent.click(screen.getByRole('link', { name: 'Volver a las funciones' }))

    expect(click).toBe(false)
    const aviso = screen.getByRole('dialog', { name: '¿Volver a las funciones?' })
    expect(aviso).toHaveTextContent(
      'Tenés 3 butacas elegidas para el sábado 5. Si volvés, se pierde la selección.',
    )
  })

  it('usa el singular con una sola butaca', () => {
    render(<BackToPerformances selectionCount={1} performance={SABADO} />)
    fireEvent.click(screen.getByRole('link', { name: 'Volver a las funciones' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Tenés 1 butaca elegida para el sábado 5.')
  })

  it('"Seguir eligiendo" cierra el aviso y no navega', async () => {
    render(<BackToPerformances selectionCount={2} performance={SABADO} />)
    fireEvent.click(screen.getByRole('link', { name: 'Volver a las funciones' }))

    await userEvent.click(screen.getByRole('button', { name: 'Seguir eligiendo' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
  })

  it('"Volver igual" lleva a la lista de funciones', async () => {
    render(<BackToPerformances selectionCount={2} performance={SABADO} />)
    fireEvent.click(screen.getByRole('link', { name: 'Volver a las funciones' }))

    await userEvent.click(screen.getByRole('button', { name: 'Volver igual' }))

    expect(push).toHaveBeenCalledWith('/')
  })
})
