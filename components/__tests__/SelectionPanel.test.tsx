import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SelectionPanel } from '@/components/SelectionPanel'
import { buildSeats } from '@/lib/seats'

const catalogo = buildSeats()
const pick = (row: number, number: number) =>
  catalogo.find((s) => s.sector === 'platea' && s.row === row && s.number === number)!

describe('SelectionPanel', () => {
  it('invita a elegir cuando no hay nada seleccionado', () => {
    render(
      <SelectionPanel seats={[]} limitReached={false} onRemove={vi.fn()} onClear={vi.fn()} />,
    )
    expect(screen.getByText(/eleg[íi] tus butacas/i)).toBeInTheDocument()
    expect(screen.getByText('$ 0')).toBeInTheDocument()
  })

  it('suma el total de la selección', () => {
    // Fila 2 => Platea A (45.000). Fila 12 => Platea C (30.000).
    render(
      <SelectionPanel
        seats={[pick(2, 1), pick(12, 4)]}
        limitReached={false}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    expect(screen.getByText('$ 75.000')).toBeInTheDocument()
  })

  it('ordena la lista por fila y después por butaca, sin importar el orden de entrada', () => {
    render(
      <SelectionPanel
        seats={[pick(12, 4), pick(2, 3), pick(2, 1)]}
        limitReached={false}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    const filas = screen.getAllByRole('listitem')
    expect(within(filas[0]).getByText(/Fila 2/)).toBeInTheDocument()
    expect(within(filas[0]).getByText(/Butaca 1\b/)).toBeInTheDocument()
    expect(within(filas[1]).getByText(/Butaca 3\b/)).toBeInTheDocument()
    expect(within(filas[2]).getByText(/Fila 12/)).toBeInTheDocument()
  })

  it('muestra la franja y el precio de cada butaca', () => {
    render(
      <SelectionPanel
        seats={[pick(7, 12)]}
        limitReached={false}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    expect(screen.getByText('Platea B')).toBeInTheDocument()
    expect(screen.getByText('38.000')).toBeInTheDocument()
  })

  it('permite quitar una butaca desde el panel', async () => {
    const onRemove = vi.fn()
    const butaca = pick(7, 12)
    render(
      <SelectionPanel
        seats={[butaca]}
        limitReached={false}
        onRemove={onRemove}
        onClear={vi.fn()}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /quitar fila 7, butaca 12/i }))
    expect(onRemove).toHaveBeenCalledWith(butaca)
  })

  it('permite vaciar la selección', async () => {
    const onClear = vi.fn()
    render(
      <SelectionPanel
        seats={[pick(7, 12)]}
        limitReached={false}
        onRemove={vi.fn()}
        onClear={onClear}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /vaciar/i }))
    expect(onClear).toHaveBeenCalled()
  })

  it('avisa del tope sin bloquear el panel', () => {
    render(
      <SelectionPanel
        seats={[pick(7, 12)]}
        limitReached
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    expect(screen.getByText(/8 butacas/i)).toBeInTheDocument()
  })

  it('anuncia los cambios a lectores de pantalla', () => {
    const { container } = render(
      <SelectionPanel
        seats={[pick(7, 12)]}
        limitReached={false}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    expect(container.querySelector('[aria-live="polite"]')).toBeTruthy()
  })
})
