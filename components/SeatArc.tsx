'use client'

import { Fragment, type ReactNode } from 'react'
import type { GeometryPlan, Seat } from '@/lib/types'

export type SeatRenderer = (seat: Seat, geometry: GeometryPlan) => ReactNode

export interface SeatArcProps {
  seats: Seat[]
  geometry: GeometryPlan
  renderSeat: SeatRenderer
}

export function SeatArc({ seats, geometry, renderSeat }: SeatArcProps) {
  return (
    <g>
      {seats.map((seat) => (
        <Fragment key={seat.id}>{renderSeat(seat, geometry)}</Fragment>
      ))}
    </g>
  )
}
