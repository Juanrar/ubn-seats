'use client'

import { formatPrice } from '@/lib/format'
import type { Venue } from '@/lib/venue'

export interface RowRuleProps {
  venue: Venue
  activeRow: number
  onChange: (row: number) => void
}

export function RowRule({ venue, activeRow, onChange }: RowRuleProps) {
  const first = venue.rows[0].row
  const last = venue.rows[venue.rows.length - 1].row
  const row = venue.rows.find((candidate) => candidate.row === activeRow) ?? venue.rows[0]
  const band = `${row.tier.label} · ${formatPrice(row.tier.price)}`

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between font-ui text-ui-sm text-ink-soft">
        <span>Fila {row.row}</span>
        <span>{band}</span>
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
        className="h-11 w-full cursor-pointer appearance-none bg-transparent accent-accent"
      />
      <div className="flex justify-between font-ui text-ui-xs text-ink-mute">
        <span>Escenario</span>
        <span>Fondo</span>
      </div>
    </div>
  )
}
