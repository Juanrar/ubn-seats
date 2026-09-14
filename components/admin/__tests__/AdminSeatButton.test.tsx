import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminSeatButton } from '@/components/admin/AdminSeatButton'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'
import type { AdminSeatStatus } from '@/lib/admin/seatState'

const venue = buildVenue(TEATRO_DEL_GLOBO)
const seat = venue.seats[0]

function renderSeat(status: AdminSeatStatus) {
  const onActivate = vi.fn()
  render(
    <svg>
      <AdminSeatButton
        seat={seat}
        geometry={venue.plan.geometry}
        status={status}
        focused
        onActivate={onActivate}
        onFocus={vi.fn()}
      />
    </svg>,
  )
  return { onActivate }
}

describe('AdminSeatButton', () => {
  it('anuncia el estado en el aria-label', () => {
    renderSeat('blocked')
    expect(screen.getByRole('button', { name: /bloqueada/i })).toBeInTheDocument()
  })

  it('una vendida se anuncia como vendida', () => {
    renderSeat('sold')
    expect(screen.getByRole('button', { name: /vendida/i })).toBeInTheDocument()
  })

  it('una reservada se anuncia como reservada', () => {
    renderSeat('pending')
    expect(screen.getByRole('button', { name: /reservada/i })).toBeInTheDocument()
  })

  it('una libre se anuncia como libre', () => {
    renderSeat('free')
    expect(screen.getByRole('button', { name: /libre/i })).toBeInTheDocument()
  })

  it('la bloqueada no se distingue sólo por color: lleva un aspa', () => {
    const { container } = render(
      <svg>
        <AdminSeatButton
          seat={seat}
          geometry={venue.plan.geometry}
          status="blocked"
          focused
          onActivate={vi.fn()}
          onFocus={vi.fn()}
        />
      </svg>,
    )
    expect(container.querySelectorAll('line').length).toBe(2)
  })

  it('una libre no lleva aspa', () => {
    const { container } = render(
      <svg>
        <AdminSeatButton
          seat={seat}
          geometry={venue.plan.geometry}
          status="free"
          focused
          onActivate={vi.fn()}
          onFocus={vi.fn()}
        />
      </svg>,
    )
    expect(container.querySelectorAll('line').length).toBe(0)
  })

  it('ninguna butaca está deshabilitada: las vendidas abren su orden', () => {
    renderSeat('sold')
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-disabled')
  })

  it('al clickearla avisa con la butaca', async () => {
    const { onActivate } = renderSeat('sold')
    await userEvent.click(screen.getByRole('button'))
    expect(onActivate).toHaveBeenCalledWith(seat)
  })

  it('sólo la bloqueada lleva aspa', () => {
    for (const status of ['sold', 'pending', 'selected'] as const) {
      const { container, unmount } = render(
        <svg>
          <AdminSeatButton seat={seat} geometry={venue.plan.geometry} status={status} focused onActivate={vi.fn()} onFocus={vi.fn()} />
        </svg>,
      )
      expect(container.querySelectorAll('line').length).toBe(0)
      unmount()
    }
  })

  it('la reservada se distingue de la libre por el trazo punteado', () => {
    const { container, unmount } = render(
      <svg>
        <AdminSeatButton seat={seat} geometry={venue.plan.geometry} status="pending" focused onActivate={vi.fn()} onFocus={vi.fn()} />
      </svg>,
    )
    expect(container.querySelector('rect')).toHaveAttribute('stroke-dasharray')
    unmount()

    const libre = render(
      <svg>
        <AdminSeatButton seat={seat} geometry={venue.plan.geometry} status="free" focused onActivate={vi.fn()} onFocus={vi.fn()} />
      </svg>,
    )
    expect(libre.container.querySelector('rect')).not.toHaveAttribute('stroke-dasharray')
  })

  it('las vendidas no se anuncian como alternables', () => {
    renderSeat('sold')
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-pressed')
  })
})
