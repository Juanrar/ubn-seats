import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SelectionBar } from '@/components/SelectionBar'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'

const venue = buildVenue(TEATRO_DEL_GLOBO)
const two = [venue.byId.get('platea-F07-12')!, venue.byId.get('platea-F07-14')!]

function renderBar(props: Partial<React.ComponentProps<typeof SelectionBar>> = {}) {
  const onClear = vi.fn()
  const onContinue = vi.fn()
  const view = render(
    <SelectionBar
      seats={two}
      total={76000}
      maxSeats={8}
      rejection={null}
      onClear={onClear}
      onContinue={onContinue}
      {...props}
    />,
  )
  return { onClear, onContinue, ...view }
}

describe('SelectionBar', () => {
  it('muestra el tope desde la primera butaca', () => {
    renderBar()
    expect(screen.getByText('2 de 8')).toBeInTheDocument()
  })

  it('muestra el total', () => {
    renderBar()
    expect(screen.getByText('$ 76.000')).toBeInTheDocument()
  })

  it('invita a elegir cuando no hay nada elegido', () => {
    renderBar({ seats: [], total: 0 })
    expect(screen.getByText(/eleg[ií] tus butacas/i)).toBeInTheDocument()
  })

  it('deshabilita Continuar sin selección y explica por qué', () => {
    renderBar({ seats: [], total: 0 })
    const button = screen.getByRole('button', { name: /continuar/i })
    expect(button).toBeDisabled()
    expect(button).toHaveAccessibleDescription(/eleg[ií] al menos una butaca/i)
  })

  it('habilita Continuar con selección', async () => {
    const { onContinue } = renderBar()
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(onContinue).toHaveBeenCalled()
  })

  it('vacía la selección', async () => {
    const { onClear } = renderBar()
    await userEvent.click(screen.getByRole('button', { name: /vaciar/i }))
    expect(onClear).toHaveBeenCalled()
  })

  it('anuncia la selección en una región cortés', () => {
    const { container } = renderBar()
    const polite = container.querySelector('[aria-live="polite"]')!
    expect(polite).toHaveTextContent('2 butacas seleccionadas. Total $ 76.000.')
  })

  it('anuncia el rechazo en una región asertiva y lo muestra', () => {
    const { container } = renderBar({
      rejection: {
        reason: 'tope',
        seatId: 'platea-F07-12',
        message: 'Ya elegiste 8 butacas. Quitá una para elegir otra.',
        at: 1,
      },
    })
    const assertive = container.querySelector('[aria-live="assertive"]')!
    expect(assertive).toHaveTextContent('Ya elegiste 8 butacas. Quitá una para elegir otra.')
  })

  it('la región asertiva está vacía cuando no hay rechazo', () => {
    const { container } = renderBar()
    expect(container.querySelector('[aria-live="assertive"]')).toHaveTextContent('')
  })
})
