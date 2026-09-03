'use client'

import { formatPrice } from '@/lib/format'
import type { GeometryPlan, Seat, SeatStatus } from '@/lib/types'

const STATUS_TEXT: Record<SeatStatus, string> = {
  available: 'disponible',
  selected: 'seleccionada',
  occupied: 'ocupada',
}

function shapeClass(status: SeatStatus): string {
  if (status === 'occupied') return 'fill-rule-soft stroke-none'
  if (status === 'selected') return 'fill-accent stroke-accent'
  return 'fill-transparent stroke-ink-mute'
}

export interface SeatShapeProps {
  status: SeatStatus
  width: number
  height: number
  className?: string
}

export function SeatShape({ status, width, height, className = '' }: SeatShapeProps) {
  return (
    <rect
      x={-width / 2}
      y={-height / 2}
      width={width}
      height={height}
      rx={1}
      strokeWidth={1}
      className={`${shapeClass(status)} ${className}`}
    />
  )
}

export interface SeatButtonProps {
  seat: Seat
  geometry: GeometryPlan
  status: SeatStatus
  focused: boolean
  onToggle: (seat: Seat) => void
  onFocus: (id: string) => void
  revealDelayMs?: number
}

export function SeatButton({
  seat,
  geometry,
  status,
  focused,
  onToggle,
  onFocus,
  revealDelayMs = 0,
}: SeatButtonProps) {
  const occupied = status === 'occupied'
  const label = `${seat.label}, ${formatPrice(seat.price)} pesos, ${STATUS_TEXT[status]}`

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
      <g className="seat-reveal" style={{ animationDelay: `${revealDelayMs}ms` }}>
        <SeatShape
          status={status}
          width={geometry.seatWidth}
          height={geometry.seatHeight}
          className={occupied ? '' : 'transition-colors hover:stroke-accent'}
        />
      </g>
      <title>{label}</title>
    </g>
  )
}
