import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SeatButton } from '@/components/Seat'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'

const seats = buildVenue(TEATRO_DEL_GLOBO).seats
const butaca = seats.find((s) => s.sector === 'platea' && s.row === 7 && s.number === 12)!

function renderSeat(props: Partial<Parameters<typeof SeatButton>[0]> = {}) {
  const onToggle = vi.fn()
  const onFocus = vi.fn()
  render(
    <svg>
      <SeatButton
        seat={butaca}
        geometry={TEATRO_DEL_GLOBO.geometry}
        status="available"
        focused
        onToggle={onToggle}
        onFocus={onFocus}
        {...props}
      />
    </svg>,
  )
  return { onToggle, onFocus }
}

describe('SeatButton', () => {
  it('expone la plaza como botón con su descripción y precio', () => {
    renderSeat()
    const boton = screen.getByRole('button')
    expect(boton).toHaveAccessibleName(/Fila 7, butaca 12, Platea B/)
    expect(boton).toHaveAccessibleName(/38\.000/)
    expect(boton).toHaveAccessibleName(/disponible/i)
  })

  it('avisa cuando la butaca está seleccionada', () => {
    renderSeat({ status: 'selected' })
    expect(screen.getByRole('button')).toHaveAccessibleName(/seleccionada/i)
  })

  it('avisa cuando la butaca está ocupada y la deshabilita', () => {
    renderSeat({ status: 'occupied' })
    const boton = screen.getByRole('button')
    expect(boton).toHaveAccessibleName(/ocupada/i)
    expect(boton).toHaveAttribute('aria-disabled', 'true')
  })

  it('llama a onToggle al hacer click en una butaca disponible', async () => {
    const { onToggle } = renderSeat()
    await userEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledWith(butaca)
  })

  it('NO llama a onToggle si la butaca está ocupada', async () => {
    const { onToggle } = renderSeat({ status: 'occupied' })
    await userEvent.click(screen.getByRole('button'))
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('solo la butaca enfocada es alcanzable con Tab (roving tabindex)', () => {
    renderSeat({ focused: false })
    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '-1')
  })

  it('la butaca enfocada tiene tabindex 0', () => {
    renderSeat({ focused: true })
    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '0')
  })

})
