'use client'

import { SeatButton } from '@/components/Seat'
import { tierWeightOf } from '@/components/VenueMap'
import { formatPrice } from '@/lib/format'
import type { Seat, SeatStatus } from '@/lib/types'
import type { Venue, VenueRow } from '@/lib/venue'

export interface RowBandProps {
  venue: Venue
  row: VenueRow
  statusOf: (seat: Seat) => SeatStatus
  focusedId: string
  onToggle: (seat: Seat) => void
  onFocus: (id: string) => void
  onKeyDown: (event: React.KeyboardEvent<SVGSVGElement>) => void
}

export function RowBand({
  venue,
  row,
  statusOf,
  focusedId,
  onToggle,
  onFocus,
  onKeyDown,
}: RowBandProps) {
  const { geometry } = venue.plan
  const heading = `Fila ${row.row} · ${row.tier.label} · ${formatPrice(row.tier.price)}`
  const inBand = row.seats.some((seat) => seat.id === focusedId)
  const tabbableId = inBand ? focusedId : row.seats[0].id

  return (
    <div className="flex flex-col gap-2">
      <p className="font-ui text-ui-sm text-ink-soft">{heading}</p>
      <svg
        viewBox={row.viewBox}
        role="grid"
        aria-label={heading}
        aria-describedby="band-hint"
        className="h-auto w-full touch-manipulation select-none"
        onKeyDown={onKeyDown}
      >
        <g role="row">
          {row.seats.map((seat) => (
            <SeatButton
              key={seat.id}
              seat={seat}
              geometry={geometry}
              status={statusOf(seat)}
              focused={seat.id === tabbableId}
              tierWeight={tierWeightOf(venue, seat.price)}
              onToggle={onToggle}
              onFocus={onFocus}
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
