'use client'

import { formatPrice, formatTotal } from '@/lib/format'
import type { Seat } from '@/lib/types'

export interface SelectionPanelProps {
  seats: Seat[]
  total: number
  maxSeats: number
  limitReached: boolean
  onRemove: (seat: Seat) => void
  onClear: () => void
}

export function SelectionPanel({
  seats,
  total,
  maxSeats,
  limitReached,
  onRemove,
  onClear,
}: SelectionPanelProps) {
  return (
    <section aria-labelledby="resumen-titulo" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between border-b border-rule pb-2">
        <h2 id="resumen-titulo" className="text-hand-h2 font-semibold">
          Tu selección
        </h2>
        {seats.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-hand-sm text-ink-mute underline-offset-4 hover:text-accent hover:underline"
          >
            Vaciar
          </button>
        ) : null}
      </div>

      <p aria-live="polite" className="sr-only">
        {seats.length === 0
          ? 'No hay butacas seleccionadas.'
          : `${seats.length} ${seats.length === 1 ? 'butaca seleccionada' : 'butacas seleccionadas'}. Total ${formatTotal(total)}.`}
      </p>

      {seats.length === 0 ? (
        <p className="text-hand-base text-ink-mute">
          Elegí tus butacas en el mapa. Podés seleccionar hasta {maxSeats}.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-rule-soft">
          {seats.map((seat) => (
            <li key={seat.id} className="flex items-center justify-between gap-3 py-2">
              <div className="flex flex-col">
                <span className="text-hand-base">
                  Fila {seat.row} · Butaca {seat.number}
                </span>
                <span className="text-hand-xs text-ink-mute">{seat.tier}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs">{formatPrice(seat.price)}</span>
                <button
                  type="button"
                  onClick={() => onRemove(seat)}
                  aria-label={`Quitar fila ${seat.row}, butaca ${seat.number}`}
                  className="text-hand-sm text-ink-mute hover:text-accent"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {limitReached ? (
        <p className="text-hand-sm text-accent">
          Llegaste al máximo de {maxSeats} butacas por compra.
        </p>
      ) : null}

      <div className="flex items-baseline justify-between border-t border-rule pt-2">
        <span className="text-hand-lead text-ink-soft">Total</span>
        <span className="font-mono text-base">{formatTotal(total)}</span>
      </div>
    </section>
  )
}
