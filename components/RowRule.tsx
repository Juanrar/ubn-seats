'use client'

import { formatPrice } from '@/lib/format'
import type { Venue } from '@/lib/venue'

const THUMB_WIDTH = 16

export interface RowRuleProps {
  venue: Venue
  activeRow: number
  onChange: (row: number) => void
}

export function RowRule({ venue, activeRow, onChange }: RowRuleProps) {
  const first = venue.rows[0].row
  const last = venue.rows[venue.rows.length - 1].row
  const span = last - first
  const row = venue.rows.find((candidate) => candidate.row === activeRow) ?? venue.rows[0]
  const band = `${row.tier.label} · ${formatPrice(row.tier.price)}`
  const tierStartRows = new Set(venue.tierBands.map((tierBand) => tierBand.fromRow))

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between font-ui text-ui-sm text-ink-soft">
        <span>Fila {row.row}</span>
        <span>{band}</span>
      </div>
      <div className="relative h-11 w-full">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-rule" />
          {venue.rows.map((candidate) => {
            const percent = span === 0 ? 0 : (candidate.row - first) / span
            const tierStart = tierStartRows.has(candidate.row)
            return (
              <span
                key={candidate.row}
                data-row-tick={candidate.row}
                data-tier-start={tierStart}
                className={`absolute top-1/2 w-px -translate-x-1/2 -translate-y-1/2 ${
                  tierStart ? 'h-3 bg-ink' : 'h-1.5 bg-rule'
                }`}
                style={{
                  left: `calc(${THUMB_WIDTH / 2}px + (100% - ${THUMB_WIDTH}px) * ${percent})`,
                }}
              />
            )
          })}
        </div>
        <input
          type="range"
          min={first}
          max={last}
          step={1}
          value={activeRow}
          aria-label="Fila"
          aria-valuetext={`Fila ${row.row}, ${row.tier.label}, ${formatPrice(row.tier.price)}`}
          onChange={(event) => onChange(Number(event.target.value))}
          className="row-rule-slider relative h-11 w-full cursor-pointer appearance-none bg-transparent"
        />
      </div>
      <div className="flex justify-between font-ui text-ui-xs text-ink-mute">
        <span>Escenario</span>
        <span>Fondo</span>
      </div>
    </div>
  )
}
