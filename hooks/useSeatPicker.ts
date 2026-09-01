'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { nextSeatId, type Direction } from '@/lib/navigation'
import type { Seat, SeatStatus } from '@/lib/types'
import type { Venue } from '@/lib/venue'

const ARROWS: Record<string, Direction> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
}

export interface SeatPicker {
  statusOf: (seat: Seat) => SeatStatus
  focusedId: string
  selectedSeats: Seat[]
  total: number
  limitReached: boolean
  toggle: (seat: Seat) => void
  clear: () => void
  onSeatFocus: (id: string) => void
  onKeyDown: (event: React.KeyboardEvent<SVGSVGElement>) => void
}

export function useSeatPicker(venue: Venue, occupied: Set<string>): SeatPicker {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [focusedId, setFocusedId] = useState<string>(() => venue.seats[0].id)
  const pendingFocus = useRef<string | null>(null)

  useEffect(() => {
    if (!pendingFocus.current) return
    const target = document.querySelector<SVGGElement>(
      `[data-seat-id="${CSS.escape(pendingFocus.current)}"]`,
    )
    pendingFocus.current = null
    target?.focus()
  })

  const toggle = useCallback(
    (seat: Seat) => {
      if (occupied.has(seat.id)) return
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(seat.id)) {
          next.delete(seat.id)
          return next
        }
        if (next.size >= venue.maxSeats) return prev
        next.add(seat.id)
        return next
      })
    },
    [occupied, venue],
  )

  const clear = useCallback(() => setSelectedIds(new Set()), [])

  const statusOf = useCallback(
    (seat: Seat): SeatStatus => {
      if (occupied.has(seat.id)) return 'occupied'
      return selectedIds.has(seat.id) ? 'selected' : 'available'
    },
    [occupied, selectedIds],
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<SVGSVGElement>) => {
      const direction = ARROWS[event.key]
      if (direction) {
        event.preventDefault()
        const next = nextSeatId(venue.seats, focusedId, direction)
        if (next !== focusedId) {
          setFocusedId(next)
          pendingFocus.current = next
        }
        return
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        const seat = venue.byId.get(focusedId)
        if (seat) toggle(seat)
      }
    },
    [focusedId, toggle, venue],
  )

  const selectedSeats = useMemo(
    () =>
      venue.seats
        .filter((seat) => selectedIds.has(seat.id))
        .sort((a, b) => a.row - b.row || a.number - b.number),
    [selectedIds, venue],
  )

  const total = useMemo(
    () => selectedSeats.reduce((sum, seat) => sum + seat.price, 0),
    [selectedSeats],
  )

  return {
    statusOf,
    focusedId,
    selectedSeats,
    total,
    limitReached: selectedIds.size >= venue.maxSeats,
    toggle,
    clear,
    onSeatFocus: setFocusedId,
    onKeyDown,
  }
}
