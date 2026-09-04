'use client'

import { formatTotal } from '@/lib/format'
import type { ReservationStatus } from '@/hooks/useReservation'
import type { Seat } from '@/lib/types'

export interface SelectionBarProps {
  seats: Seat[]
  total: number
  status: ReservationStatus
  errorMessage: string | null
  onContinue: () => void
}

export function SelectionBar({ seats, total, status, errorMessage, onContinue }: SelectionBarProps) {
  if (seats.length === 0) return null

  const pending = status === 'pending'

  return (
    <section
      aria-label="Resumen de selección y continuar"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper"
    >
      <div className="mx-auto flex w-full max-w-[var(--layout-stack)] flex-col gap-2 px-5 py-4">
        {errorMessage && (
          <p role="alert" className="text-hand-sm text-ink">
            {errorMessage}
          </p>
        )}
        <div className="flex items-center justify-between gap-4">
          <span className="text-hand-base">
            {seats.length} {seats.length === 1 ? 'butaca' : 'butacas'} ·{' '}
            <span className="font-mono text-base">{formatTotal(total)}</span>
          </span>
          <button
            type="button"
            onClick={onContinue}
            disabled={pending}
            className="shrink-0 rounded-sm bg-accent px-5 py-2 text-hand-base text-paper hover:bg-accent-soft disabled:opacity-50"
          >
            {pending ? 'Reservando…' : 'Continuar'}
          </button>
        </div>
      </div>
    </section>
  )
}
