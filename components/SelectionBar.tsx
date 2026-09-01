'use client'

import type { Rejection } from '@/hooks/useSeatPicker'
import { formatTotal } from '@/lib/format'
import type { Seat } from '@/lib/types'

export interface SelectionBarProps {
  seats: Seat[]
  total: number
  maxSeats: number
  rejection: Rejection | null
  onClear: () => void
  onContinue: () => void
}

export function SelectionBar({
  seats,
  total,
  maxSeats,
  rejection,
  onClear,
  onContinue,
}: SelectionBarProps) {
  const empty = seats.length === 0

  return (
    <div className="border-t border-rule bg-paper px-4 pb-[env(safe-area-inset-bottom)] pt-3">
      <p
        aria-live="assertive"
        className="min-h-5 font-ui text-ui-sm text-highlight"
      >
        {rejection ? rejection.message : ''}
      </p>
      <p aria-live="polite" className="sr-only">
        {empty
          ? 'Ninguna butaca seleccionada.'
          : `${seats.length} ${seats.length === 1 ? 'butaca seleccionada' : 'butacas seleccionadas'}. Total ${formatTotal(total)}.`}
      </p>
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          {empty ? (
            <span className="font-ui text-ui-base text-ink-soft">Elegí tus butacas</span>
          ) : (
            <>
              <span className="font-ui text-ui-sm text-ink-mute">
                {seats.length} de {maxSeats}
              </span>
              <span className="font-mono text-ui-xl tabular-nums text-ink">
                {formatTotal(total)}
              </span>
            </>
          )}
        </div>
        {empty ? null : (
          <button
            type="button"
            onClick={onClear}
            className="min-h-11 px-3 font-ui text-ui-sm text-ink-mute underline underline-offset-4"
          >
            Vaciar
          </button>
        )}
        <button
          type="button"
          onClick={onContinue}
          disabled={empty}
          aria-describedby={empty ? 'continuar-hint' : undefined}
          className="min-h-11 rounded-sm border border-ink bg-ink px-5 font-ui text-ui-base text-paper disabled:border-rule disabled:bg-transparent disabled:text-ink-mute"
        >
          Continuar
        </button>
      </div>
      <span id="continuar-hint" className="sr-only">
        Elegí al menos una butaca para continuar.
      </span>
    </div>
  )
}
