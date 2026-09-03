'use client'

import { formatTotal } from '@/lib/format'
import type { Seat } from '@/lib/types'

export interface SelectionBarProps {
  seats: Seat[]
  total: number
  onContinue: () => void
}

export function SelectionBar({ seats, total, onContinue }: SelectionBarProps) {
  if (seats.length === 0) return null

  return (
    <section
      aria-label="Resumen de selección y continuar"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper"
    >
      <div className="mx-auto flex w-full max-w-[var(--layout-stack)] items-center justify-between gap-4 px-5 py-4">
        <span className="text-hand-base">
          {seats.length} {seats.length === 1 ? 'butaca' : 'butacas'} ·{' '}
          <span className="font-mono text-base">{formatTotal(total)}</span>
        </span>
        <button
          type="button"
          onClick={onContinue}
          className="shrink-0 rounded-sm bg-accent px-5 py-2 text-hand-base text-paper hover:bg-accent-soft"
        >
          Continuar
        </button>
      </div>
    </section>
  )
}
