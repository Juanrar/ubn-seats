'use client'

import { useCallback, useState } from 'react'
import { MAX_SEATS } from '@/lib/constants'
import type { Seat } from '@/lib/types'

export interface SeatSelection {
  selectedIds: Set<string>
  toggle: (seat: Seat) => void
  clear: () => void
  limitReached: boolean
}

/**
 * Selección de butacas con tope. Las ocupadas nunca entran, ni siquiera si
 * alguien llama a toggle a mano.
 */
export function useSeatSelection(occupied: Set<string>): SeatSelection {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const toggle = useCallback(
    (seat: Seat) => {
      if (occupied.has(seat.id)) return
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(seat.id)) {
          next.delete(seat.id)
          return next
        }
        if (next.size >= MAX_SEATS) return prev
        next.add(seat.id)
        return next
      })
    },
    [occupied],
  )

  const clear = useCallback(() => setSelectedIds(new Set()), [])

  return { selectedIds, toggle, clear, limitReached: selectedIds.size >= MAX_SEATS }
}
