'use client'

import { SEAT_HEIGHT, SEAT_WIDTH } from '@/lib/constants'
import { formatPrice } from '@/lib/format'
import { seatLabel } from '@/lib/seats'
import type { Seat, SeatStatus } from '@/lib/types'

const STATUS_TEXT: Record<SeatStatus, string> = {
  available: 'disponible',
  selected: 'seleccionada',
  occupied: 'ocupada',
}

/** Clases del rect según el estado. El trazo discontinuo lo pone `kind`. */
function shapeClass(status: SeatStatus): string {
  if (status === 'occupied') return 'fill-rule-soft stroke-none'
  if (status === 'selected') return 'fill-accent stroke-accent'
  return 'fill-transparent stroke-ink-mute'
}

export interface SeatShapeProps {
  status: SeatStatus
  kind: Seat['kind']
  className?: string
}

/** El rectángulo suelto, sin interacción. Lo reutiliza la leyenda. */
export function SeatShape({ status, kind, className = '' }: SeatShapeProps) {
  return (
    <rect
      x={-SEAT_WIDTH / 2}
      y={-SEAT_HEIGHT / 2}
      width={SEAT_WIDTH}
      height={SEAT_HEIGHT}
      rx={2}
      strokeWidth={1}
      strokeDasharray={kind === 'accessible' ? '3 2' : undefined}
      className={`${shapeClass(status)} ${className}`}
    />
  )
}

export interface SeatButtonProps {
  seat: Seat
  status: SeatStatus
  focused: boolean
  onToggle: (seat: Seat) => void
  onFocus: (id: string) => void
}

export function SeatButton({ seat, status, focused, onToggle, onFocus }: SeatButtonProps) {
  const occupied = status === 'occupied'
  const label = `${seatLabel(seat)}, ${formatPrice(seat.price)} pesos, ${STATUS_TEXT[status]}`

  return (
    <g
      role="button"
      aria-label={label}
      aria-disabled={occupied || undefined}
      aria-pressed={occupied ? undefined : status === 'selected'}
      tabIndex={focused ? 0 : -1}
      data-seat-id={seat.id}
      transform={`translate(${seat.x} ${seat.y}) rotate(${seat.angle})`}
      className={occupied ? 'cursor-default' : 'cursor-pointer'}
      onClick={() => {
        if (!occupied) onToggle(seat)
      }}
      onFocus={() => onFocus(seat.id)}
    >
      <SeatShape
        status={status}
        kind={seat.kind}
        className={occupied ? '' : 'transition-colors hover:stroke-accent'}
      />
      <title>{label}</title>
    </g>
  )
}
