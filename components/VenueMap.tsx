'use client'

import { SeatShape } from '@/components/Seat'
import { formatPrice } from '@/lib/format'
import type { Seat, SeatStatus } from '@/lib/types'
import type { Venue } from '@/lib/venue'

const MAX_WEIGHT = 1.6
const MIN_WEIGHT = 0.7
const ROW_LABEL_GAP = 26

export function tierWeightOf(venue: Venue, price: number): number {
  const prices = venue.seats.map((seat) => seat.price)
  const top = Math.max(...prices)
  const bottom = Math.min(...prices)
  if (top === bottom) return MAX_WEIGHT
  const ratio = (price - bottom) / (top - bottom)
  return MIN_WEIGHT + ratio * (MAX_WEIGHT - MIN_WEIGHT)
}

export interface VenueMapProps {
  venue: Venue
  statusOf: (seat: Seat) => SeatStatus
  activeRow: number
  onPickRow: (row: number) => void
}

export function VenueMap({ venue, statusOf, activeRow, onPickRow }: VenueMapProps) {
  const { geometry } = venue.plan
  const { stage } = venue

  return (
    <svg
      viewBox={venue.viewBox}
      className="block h-auto w-full select-none"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x={stage.x}
        y={stage.y}
        width={stage.width}
        height={stage.height}
        rx={4}
        className="fill-paper-2 stroke-rule"
        strokeWidth={1}
      />
      <text
        x={stage.x + stage.width / 2}
        y={stage.y + stage.height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-ink-mute font-ui text-[16px]"
      >
        {stage.label}
      </text>

      {venue.tierBands.map((band) => (
        <text
          key={band.label}
          x={venue.tierLabelX}
          y={band.y}
          textAnchor="end"
          dominantBaseline="middle"
          className="fill-ink-mute font-ui text-[15px]"
        >
          {`${band.label} · ${formatPrice(band.price)}`}
        </text>
      ))}

      {venue.rows.map((row) => {
        const active = row.row === activeRow
        const xs = row.seats.map((seat) => seat.x)
        return (
          <g
            key={row.row}
            data-row={row.row}
            data-active={active}
            className={active ? 'opacity-100' : 'opacity-45'}
            onClick={() => onPickRow(row.row)}
          >
            <text
              x={Math.min(...xs) - ROW_LABEL_GAP}
              y={row.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-ink-mute font-ui text-[15px]"
            >
              {row.row}
            </text>
            {row.seats.map((seat) => (
              <g
                key={seat.id}
                data-seat-id={seat.id}
                data-row={row.row}
                data-active={active}
                transform={`translate(${seat.x} ${seat.y}) rotate(${seat.angle})`}
              >
                <SeatShape
                  status={statusOf(seat)}
                  width={geometry.seatWidth}
                  height={geometry.seatHeight}
                  tierWeight={tierWeightOf(venue, seat.price)}
                />
              </g>
            ))}
            <text
              x={Math.max(...xs) + ROW_LABEL_GAP}
              y={row.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-ink-mute font-ui text-[15px]"
            >
              {row.row}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
