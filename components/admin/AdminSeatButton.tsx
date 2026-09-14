'use client'

import type { AdminSeatStatus } from '@/lib/admin/seatState'
import type { GeometryPlan, Seat } from '@/lib/types'

const STATUS_TEXT: Record<AdminSeatStatus, string> = {
  free: 'libre',
  selected: 'seleccionada',
  blocked: 'bloqueada',
  sold: 'vendida',
  pending: 'reservada',
}

const SHAPE_CLASS: Record<AdminSeatStatus, string> = {
  free: 'fill-transparent stroke-ink-mute',
  selected: 'fill-accent stroke-accent',
  blocked: 'fill-transparent stroke-ink',
  sold: 'fill-rule-soft stroke-none',
  pending: 'fill-transparent stroke-rule',
}

export interface AdminSeatButtonProps {
  seat: Seat
  geometry: GeometryPlan
  status: AdminSeatStatus
  focused: boolean
  onActivate: (seat: Seat) => void
  onFocus: (id: string) => void
}

export function AdminSeatButton({
  seat,
  geometry,
  status,
  focused,
  onActivate,
  onFocus,
}: AdminSeatButtonProps) {
  const label = `${seat.label}, ${STATUS_TEXT[status]}`
  const halfWidth = geometry.seatWidth / 2
  const halfHeight = geometry.seatHeight / 2

  return (
    <g
      role="button"
      aria-label={label}
      aria-pressed={status === 'selected'}
      tabIndex={focused ? 0 : -1}
      data-seat-id={seat.id}
      transform={`translate(${seat.x} ${seat.y}) rotate(${seat.angle})`}
      className="cursor-pointer"
      onClick={() => onActivate(seat)}
      onFocus={() => onFocus(seat.id)}
    >
      <rect
        x={-halfWidth}
        y={-halfHeight}
        width={geometry.seatWidth}
        height={geometry.seatHeight}
        rx={1}
        strokeWidth={1}
        className={`${SHAPE_CLASS[status]} transition-colors hover:stroke-accent`}
      />
      {status === 'blocked' ? (
        <>
          <line
            x1={-halfWidth}
            y1={-halfHeight}
            x2={halfWidth}
            y2={halfHeight}
            strokeWidth={0.6}
            className="stroke-ink"
          />
          <line
            x1={-halfWidth}
            y1={halfHeight}
            x2={halfWidth}
            y2={-halfHeight}
            strokeWidth={0.6}
            className="stroke-ink"
          />
        </>
      ) : null}
      <title>{label}</title>
    </g>
  )
}
