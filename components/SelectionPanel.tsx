'use client'

import { MAX_SEATS } from '@/lib/constants'
import { formatPrice, formatTotal } from '@/lib/format'
import { tierLabel } from '@/lib/pricing'
import type { Seat } from '@/lib/types'

export interface SelectionPanelProps {
  /** Butacas ya resueltas, no ids: el panel no toca el catálogo. */
  seats: Seat[]
  limitReached: boolean
  onRemove: (seat: Seat) => void
  onClear: () => void
}

function seatName(seat: Seat): string {
  return seat.sector === 'platea-accesible'
    ? `Espacio ${seat.number}`
    : `Butaca ${seat.number}`
}

export function SelectionPanel({ seats, limitReached, onRemove, onClear }: SelectionPanelProps) {
  const ordered = [...seats].sort((a, b) => a.row - b.row || a.number - b.number)
  const total = ordered.reduce((sum, seat) => sum + seat.price, 0)

  return (
    <section aria-labelledby="resumen-titulo" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between border-b border-rule pb-2">
        <h2 id="resumen-titulo" className="text-lg">
          Tu selección
        </h2>
        {ordered.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="font-mono text-xs text-ink-mute underline-offset-4 hover:text-accent hover:underline"
          >
            Vaciar
          </button>
        ) : null}
      </div>

      <p aria-live="polite" className="sr-only">
        {ordered.length === 0
          ? 'No hay butacas seleccionadas.'
          : `${ordered.length} ${ordered.length === 1 ? 'butaca seleccionada' : 'butacas seleccionadas'}. Total ${formatTotal(total)}.`}
      </p>

      {ordered.length === 0 ? (
        <p className="text-sm text-ink-mute">
          Elegí tus butacas en el mapa. Podés seleccionar hasta {MAX_SEATS}.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-rule-soft">
          {ordered.map((seat) => (
            <li key={seat.id} className="flex items-center justify-between gap-3 py-2">
              <div className="flex flex-col">
                <span className="font-mono text-sm">
                  Fila {seat.row} · {seatName(seat)}
                </span>
                <span className="text-xs text-ink-mute">{tierLabel(seat.sector, seat.row)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm">{formatPrice(seat.price)}</span>
                <button
                  type="button"
                  onClick={() => onRemove(seat)}
                  aria-label={`Quitar fila ${seat.row}, ${seatName(seat).toLowerCase()}`}
                  className="font-mono text-xs text-ink-mute hover:text-accent"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {limitReached ? (
        <p className="text-xs text-accent">
          Llegaste al máximo de {MAX_SEATS} butacas por compra.
        </p>
      ) : null}

      <div className="flex items-baseline justify-between border-t border-rule pt-2">
        <span className="text-sm text-ink-soft">Total</span>
        <span className="font-mono text-lg">{formatTotal(total)}</span>
      </div>
    </section>
  )
}
