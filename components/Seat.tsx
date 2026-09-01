'use client'

import { formatPrice } from '@/lib/format'
import type { GeometryPlan, Seat, SeatStatus } from '@/lib/types'

const STATUS_TEXT: Record<SeatStatus, string> = {
  available: 'disponible',
  selected: 'seleccionada',
  occupied: 'ocupada',
}

function shapeClass(status: SeatStatus): string {
  if (status === 'occupied') return 'fill-transparent stroke-rule'
  if (status === 'selected') return 'fill-accent stroke-accent'
  return 'fill-transparent stroke-ink-mute'
}

export interface SeatShapeProps {
  status: SeatStatus
  width: number
  height: number
  tierWeight: number
  className?: string
}

export function SeatShape({
  status,
  width,
  height,
  tierWeight,
  className = '',
}: SeatShapeProps) {
  const half = { w: width / 2, h: height / 2 }
  return (
    <>
      <rect
        x={-half.w}
        y={-half.h}
        width={width}
        height={height}
        rx={2}
        strokeWidth={tierWeight}
        className={`${shapeClass(status)} ${className}`}
      />
      {status === 'occupied' ? (
        <line
          data-testid="seat-slash"
          x1={-half.w}
          y1={half.h}
          x2={half.w}
          y2={-half.h}
          strokeWidth={tierWeight}
          className="stroke-rule"
        />
      ) : null}
    </>
  )
}

export interface SeatButtonProps {
  seat: Seat
  geometry: GeometryPlan
  status: SeatStatus
  focused: boolean
  tierWeight: number
  onToggle: (seat: Seat) => void
  onFocus: (id: string) => void
}

export function SeatButton({
  seat,
  geometry,
  status,
  focused,
  tierWeight,
  onToggle,
  onFocus,
}: SeatButtonProps) {
  const occupied = status === 'occupied'
  const label = `${seat.label}, ${formatPrice(seat.price)} pesos, ${STATUS_TEXT[status]}`

  return (
    <g
      role="gridcell"
      aria-label={label}
      aria-disabled={occupied || undefined}
      aria-selected={occupied ? undefined : status === 'selected'}
      tabIndex={focused ? 0 : -1}
      data-seat-id={seat.id}
      data-status={status}
      transform={`translate(${seat.x} ${seat.y}) rotate(${seat.angle})`}
      className={occupied ? 'cursor-default' : 'cursor-pointer'}
      onClick={() => onToggle(seat)}
      onFocus={() => onFocus(seat.id)}
    >
      <SeatShape
        status={status}
        width={geometry.seatWidth}
        height={geometry.seatHeight}
        tierWeight={tierWeight}
        className={occupied ? '' : 'transition-colors hover:stroke-accent'}
      />
      <title>{label}</title>
    </g>
  )
}
