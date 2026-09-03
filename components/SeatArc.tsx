'use client'

import { SeatButton } from '@/components/Seat'
import type { GeometryPlan, Seat, SeatStatus } from '@/lib/types'

export interface SeatArcProps {
  seats: Seat[]
  geometry: GeometryPlan
  statusOf: (seat: Seat) => SeatStatus
  focusedId: string | null
  onToggle: (seat: Seat) => void
  onFocus: (id: string) => void
  revealDelayOf?: (seat: Seat) => number
}

export function SeatArc({
  seats,
  geometry,
  statusOf,
  focusedId,
  onToggle,
  onFocus,
  revealDelayOf = () => 0,
}: SeatArcProps) {
  return (
    <g>
      {seats.map((seat) => (
        <SeatButton
          key={seat.id}
          seat={seat}
          geometry={geometry}
          status={statusOf(seat)}
          focused={seat.id === focusedId}
          onToggle={onToggle}
          onFocus={onFocus}
          revealDelayMs={revealDelayOf(seat)}
        />
      ))}
    </g>
  )
}
