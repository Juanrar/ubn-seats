'use client'

import { SeatArc, type SeatArcProps } from '@/components/SeatArc'
import { Stage } from '@/components/Stage'
import type { Venue } from '@/lib/venue'

export interface SeatMapProps extends Omit<SeatArcProps, 'seats' | 'geometry'> {
  venue: Venue
  onKeyDown?: (event: React.KeyboardEvent<SVGSVGElement>) => void
}

export function SeatMap({ venue, onKeyDown, ...arcProps }: SeatMapProps) {
  return (
    <svg
      role="group"
      aria-label="Mapa de butacas de la Platea"
      viewBox={venue.viewBox}
      onKeyDown={onKeyDown}
      className="h-auto w-full touch-pan-x touch-pan-y select-none"
    >
      <Stage stage={venue.stage} />
      {venue.rows.map((row) => (
        <SeatArc
          key={row.row}
          seats={row.seats}
          geometry={venue.plan.geometry}
          {...arcProps}
        />
      ))}
    </svg>
  )
}
