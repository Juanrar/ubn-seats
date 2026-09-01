import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Confirmation } from '@/components/Confirmation'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'

const venue = buildVenue(TEATRO_DEL_GLOBO)
const two = [venue.byId.get('platea-F07-12')!, venue.byId.get('platea-F07-14')!]

function renderConfirmation() {
  const onBack = vi.fn()
  const view = render(
    <Confirmation
      seats={two}
      total={76000}
      venueName="Teatro del Globo"
      sectionName="Platea"
      onBack={onBack}
    />,
  )
  return { onBack, ...view }
}

describe('Confirmation', () => {
  it('encabeza la confirmación', () => {
    renderConfirmation()
    expect(screen.getByRole('heading', { name: /listo/i })).toBeInTheDocument()
  })

  it('lista cada butaca con su fila, su número y su precio', () => {
    renderConfirmation()
    expect(screen.getByText('Fila 7 · Butaca 12')).toBeInTheDocument()
    expect(screen.getByText('Fila 7 · Butaca 14')).toBeInTheDocument()
    expect(screen.getAllByText('38.000')).toHaveLength(2)
  })

  it('muestra el total', () => {
    renderConfirmation()
    expect(screen.getByText('$ 76.000')).toBeInTheDocument()
  })

  it('nombra el teatro y el sector', () => {
    renderConfirmation()
    expect(screen.getByText(/Teatro del Globo/)).toBeInTheDocument()
    expect(screen.getByText(/Platea/)).toBeInTheDocument()
  })

  it('aclara que no se cobró nada', () => {
    renderConfirmation()
    expect(screen.getByText(/no se cobr/i)).toBeInTheDocument()
  })

  it('permite volver al mapa', async () => {
    const { onBack } = renderConfirmation()
    await userEvent.click(screen.getByRole('button', { name: /volver/i }))
    expect(onBack).toHaveBeenCalled()
  })
})
