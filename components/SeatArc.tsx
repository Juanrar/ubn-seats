'use client'

import { SeatButton } from '@/components/Seat'
import type { Seat, SeatStatus } from '@/lib/types'

export interface SeatArcProps {
  seats: Seat[]
  statusOf: (seat: Seat) => SeatStatus
  focusedId: string | null
  onToggle: (seat: Seat) => void
  onFocus: (id: string) => void
}

/** Un grupo de plazas: normalmente una fila completa. */
export function SeatArc({ seats, statusOf, focusedId, onToggle, onFocus }: SeatArcProps) {
  return (
    <g>
      {seats.map((seat) => (
        <SeatButton
          key={seat.id}
          seat={seat}
          status={statusOf(seat)}
          focused={seat.id === focusedId}
          onToggle={onToggle}
          onFocus={onFocus}
        />
      ))}
    </g>
  )
}
