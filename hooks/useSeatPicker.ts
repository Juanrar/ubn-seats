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

export interface Rejection {
  reason: 'ocupada' | 'tope'
  seatId: string
  message: string
  at: number
}

export interface SeatPicker {
  statusOf: (seat: Seat) => SeatStatus
  focusedId: string
  selectedSeats: Seat[]
  total: number
  limitReached: boolean
  rejection: Rejection | null
  toggle: (seat: Seat) => void
  clear: () => void
  dismissRejection: () => void
  onSeatFocus: (id: string) => void
  onKeyDown: (event: React.KeyboardEvent<SVGSVGElement>) => void
}

export function useSeatPicker(venue: Venue, occupied: Set<string>): SeatPicker {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [focusedId, setFocusedId] = useState<string>(() => venue.seats[0].id)
  const [rejection, setRejection] = useState<Rejection | null>(null)
  const pendingFocus = useRef<string | null>(null)
  const rejectionCount = useRef(0)

  useEffect(() => {
    if (!pendingFocus.current) return
    const target = document.querySelector<SVGGElement>(
      `svg[role="grid"] [data-seat-id="${CSS.escape(pendingFocus.current)}"]`,
    )
    pendingFocus.current = null
    target?.focus()
  })

  const reject = useCallback((reason: Rejection['reason'], seatId: string, message: string) => {
    rejectionCount.current += 1
    setRejection({ reason, seatId, message, at: rejectionCount.current })
  }, [])

  const toggle = useCallback(
    (seat: Seat) => {
      if (occupied.has(seat.id)) {
        reject('ocupada', seat.id, 'Esa butaca ya está ocupada.')
        return
      }
      if (!selectedIds.has(seat.id) && selectedIds.size >= venue.maxSeats) {
        reject(
          'tope',
          seat.id,
          `Ya elegiste ${venue.maxSeats} butacas. Quitá una para elegir otra.`,
        )
        return
      }
      setRejection(null)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(seat.id)) next.delete(seat.id)
        else next.add(seat.id)
        return next
      })
    },
    [occupied, reject, selectedIds, venue],
  )

  const clear = useCallback(() => {
    setSelectedIds(new Set())
    setRejection(null)
  }, [])

  const dismissRejection = useCallback(() => setRejection(null), [])

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
        const next = nextSeatId(venue.seats, focusedId, direction, occupied)
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
    [focusedId, occupied, toggle, venue],
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
    rejection,
    toggle,
    clear,
    dismissRejection,
    onSeatFocus: setFocusedId,
    onKeyDown,
  }
}
