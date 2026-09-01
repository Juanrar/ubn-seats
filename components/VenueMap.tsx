'use client'

import { Fragment } from 'react'
import { SeatShape } from '@/components/Seat'
import { formatPrice } from '@/lib/format'
import type { Seat, SeatStatus } from '@/lib/types'
import type { Venue } from '@/lib/venue'

const MAX_WEIGHT = 1.6
const MIN_WEIGHT = 0.7
const INACTIVE_ROW_OPACITY = 'opacity-70'
const MOBILE_ONLY_ACTIVE = 'hidden md:block'
const DESKTOP_ONLY = 'hidden md:block'

export function tierWeightOf(venue: Venue, price: number): number {
  const prices = venue.seats.map((seat) => seat.price)
  const top = Math.max(...prices)
  const bottom = Math.min(...prices)
  if (top === bottom) return MAX_WEIGHT
  const ratio = (price - bottom) / (top - bottom)
  return MIN_WEIGHT + ratio * (MAX_WEIGHT - MIN_WEIGHT)
}

function percentOf(value: number, min: number, size: number): string {
  return `${((value - min) / size) * 100}%`
}

export interface VenueMapProps {
  venue: Venue
  statusOf: (seat: Seat) => SeatStatus
  activeRow: number
  onPickRow: (row: number) => void
}

export function VenueMap({ venue, statusOf, activeRow, onPickRow }: VenueMapProps) {
  const { geometry } = venue.plan
  const { stage, frame } = venue
  const tierStartRows = new Set(venue.tierBands.map((band) => band.fromRow))
  const activeBand = venue.tierBands.find(
    (band) => activeRow >= band.fromRow && activeRow <= band.throughRow,
  )

  const left = (x: number) => percentOf(x, frame.x, frame.width)
  const top = (y: number) => percentOf(y, frame.y, frame.height)

  return (
    <div>
      {activeBand ? (
        <p
          aria-hidden="true"
          data-mobile-tier-label={activeBand.label}
          className="mb-1 text-right font-ui text-ui-xs text-ink-mute md:hidden"
        >
          {`${activeBand.label} · ${formatPrice(activeBand.price)}`}
        </p>
      ) : null}

      <div className="relative">
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

          {venue.rows.map((row) => {
            const active = row.row === activeRow
            return (
              <g
                key={row.row}
                data-row={row.row}
                data-active={active}
                className={active ? 'opacity-100' : INACTIVE_ROW_OPACITY}
                onClick={() => onPickRow(row.row)}
              >
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
              </g>
            )
          })}
        </svg>

        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <span
            data-stage-label=""
            style={{
              left: left(stage.x + stage.width / 2),
              top: top(stage.y + stage.height / 2),
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 font-ui text-ui-sm text-ink-mute"
          >
            {stage.label}
          </span>

          {venue.tierBands.map((band) => (
            <span
              key={band.label}
              data-tier-label={band.label}
              data-x={venue.tierLabelX}
              data-y={band.y}
              style={{ left: left(venue.tierLabelX), top: top(band.y) }}
              className={`absolute -translate-x-full -translate-y-1/2 whitespace-nowrap text-right font-ui text-ui-xs text-ink-mute ${DESKTOP_ONLY}`}
            >
              {`${band.label} · ${formatPrice(band.price)}`}
            </span>
          ))}

          {venue.rows.map((row) => {
            const boundary = tierStartRows.has(row.row)
            const visibility = boundary ? '' : MOBILE_ONLY_ACTIVE
            return (
              <Fragment key={row.row}>
                <span
                  data-row-number={row.row}
                  data-side="left"
                  data-x={row.labelXLeft}
                  data-y={row.labelY}
                  style={{ left: left(row.labelXLeft), top: top(row.labelY) }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 font-ui text-ui-xs text-ink-mute ${visibility}`}
                >
                  {row.row}
                </span>
                <span
                  data-row-number={row.row}
                  data-side="right"
                  data-x={row.labelXRight}
                  data-y={row.labelY}
                  style={{ left: left(row.labelXRight), top: top(row.labelY) }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 font-ui text-ui-xs text-ink-mute ${visibility}`}
                >
                  {row.row}
                </span>
              </Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
