'use client'

import { formatPrice, formatTotal } from '@/lib/format'
import type { Seat } from '@/lib/types'

export interface ConfirmationProps {
  seats: Seat[]
  total: number
  venueName: string
  sectionName: string
  onBack: () => void
}

export function Confirmation({
  seats,
  total,
  venueName,
  sectionName,
  onBack,
}: ConfirmationProps) {
  return (
    <div className="flex min-h-dvh flex-col gap-6 px-5 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-hand text-hand-h1 text-ink">Listo</h1>
        <p className="font-ui text-ui-base text-ink-soft">
          {venueName} · {sectionName}
        </p>
      </div>

      <ul className="divide-y divide-rule-soft border-y border-rule-soft">
        {seats.map((seat) => (
          <li key={seat.id} className="flex items-baseline justify-between gap-4 py-3">
            <span className="font-ui text-ui-base text-ink">
              Fila {seat.row} · Butaca {seat.number}
            </span>
            <span className="font-mono text-ui-sm tabular-nums text-ink-soft">
              {formatPrice(seat.price)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-baseline justify-between">
        <span className="font-ui text-ui-sm text-ink-mute">Total</span>
        <span className="font-mono text-ui-2xl tabular-nums text-ink">
          {formatTotal(total)}
        </span>
      </div>

      <p className="font-ui text-ui-sm text-ink-mute">
        Esto es una maqueta: no se cobró nada y no se reservó ninguna butaca.
      </p>

      <button
        type="button"
        onClick={onBack}
        className="mt-auto min-h-11 rounded-sm border border-ink px-5 font-ui text-ui-base text-ink"
      >
        Volver al mapa
      </button>
    </div>
  )
}
