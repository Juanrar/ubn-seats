import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlateaPicker } from '@/components/PlateaPicker'

describe('PlateaPicker', () => {
  it('nombra el teatro y el sector', () => {
    render(<PlateaPicker />)
    expect(screen.getByText('Teatro del Globo')).toBeInTheDocument()
    expect(screen.getByText('Platea')).toBeInTheDocument()
  })

  it('arranca en la fila 1 con la banda y la regla', () => {
    render(<PlateaPicker />)
    expect(screen.getByRole('grid', { name: /fila 1/i })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /fila/i })).toHaveValue('1')
  })

  it('mover la regla cambia la banda', async () => {
    render(<PlateaPicker />)
    const slider = screen.getByRole('slider', { name: /fila/i })
    fireEvent.change(slider, { target: { value: '7' } })
    expect(screen.getByRole('grid', { name: /fila 7/i })).toBeInTheDocument()
  })

  it('mover la regla mueve el foco lógico para que las flechas operen en la fila nueva', () => {
    render(<PlateaPicker />)
    const slider = screen.getByRole('slider', { name: /fila/i })
    fireEvent.change(slider, { target: { value: '7' } })
    const grid = screen.getByRole('grid', { name: /fila 7/i })
    const cells = within(grid).getAllByRole('gridcell')
    const before = cells.findIndex((cell) => cell.getAttribute('tabindex') === '0')
    expect(before).toBe(0)
    fireEvent.keyDown(grid, { key: 'ArrowRight' })
    const after = cells.findIndex((cell) => cell.getAttribute('tabindex') === '0')
    expect(after).toBeGreaterThan(before)
  })

  it('elegir una butaca disponible la suma al total', async () => {
    render(<PlateaPicker />)
    const grid = screen.getByRole('grid')
    const free = within(grid)
      .getAllByRole('gridcell')
      .find((cell) => cell.getAttribute('aria-disabled') !== 'true')!
    await userEvent.click(free)
    expect(screen.getByText(/1 de 8/)).toBeInTheDocument()
  })

  it('tocar una ocupada muestra el motivo', async () => {
    render(<PlateaPicker />)
    const grid = screen.getByRole('grid')
    const taken = within(grid)
      .getAllByRole('gridcell')
      .find((cell) => cell.getAttribute('aria-disabled') === 'true')
    if (!taken) return
    await userEvent.click(taken)
    expect(screen.getByText('Esa butaca ya está ocupada.')).toBeInTheDocument()
  })

  it('Continuar lleva a la confirmación y se puede volver', async () => {
    render(<PlateaPicker />)
    const grid = screen.getByRole('grid')
    const free = within(grid)
      .getAllByRole('gridcell')
      .find((cell) => cell.getAttribute('aria-disabled') !== 'true')!
    await userEvent.click(free)
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(screen.getByRole('heading', { name: /listo/i })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /volver/i }))
    expect(screen.getByRole('slider', { name: /fila/i })).toBeInTheDocument()
  })

  it('no deja el plano en el orden de tabulación', () => {
    const { container } = render(<PlateaPicker />)
    const tabbable = container.querySelectorAll('svg[role="grid"] [tabindex="0"]')
    expect(tabbable).toHaveLength(1)
  })
})
