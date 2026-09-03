import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SelectionBar } from '@/components/SelectionBar'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'

const catalogo = buildVenue(TEATRO_DEL_GLOBO).seats
const pick = (row: number, number: number) =>
  catalogo.find((s) => s.sector === 'platea' && s.row === row && s.number === number)!

describe('SelectionBar', () => {
  it('no renderiza nada sin butacas seleccionadas', () => {
    const { container } = render(<SelectionBar seats={[]} total={0} onContinue={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('muestra la cantidad de butacas y el total con selección', () => {
    render(
      <SelectionBar seats={[pick(2, 1), pick(12, 4)]} total={75000} onContinue={vi.fn()} />,
    )
    expect(screen.getByText(/2 butacas/i)).toBeInTheDocument()
    expect(screen.getByText('$ 75.000')).toBeInTheDocument()
  })

  it('usa singular cuando hay una sola butaca', () => {
    render(<SelectionBar seats={[pick(7, 12)]} total={38000} onContinue={vi.fn()} />)
    expect(screen.getByText(/1 butaca\b/i)).toBeInTheDocument()
  })

  it('el botón Continuar está habilitado y dispara onContinue al clickear', async () => {
    const onContinue = vi.fn()
    render(<SelectionBar seats={[pick(7, 12)]} total={38000} onContinue={onContinue} />)
    const boton = screen.getByRole('button', { name: /continuar/i })
    expect(boton).toBeEnabled()
    await userEvent.click(boton)
    expect(onContinue).toHaveBeenCalledTimes(1)
  })
})
