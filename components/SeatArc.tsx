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
}

export function SeatArc({
  seats,
  geometry,
  statusOf,
  focusedId,
  onToggle,
  onFocus,
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
          tierWeight={1}
          onToggle={onToggle}
          onFocus={onFocus}
        />
      ))}
    </g>
  )
}
