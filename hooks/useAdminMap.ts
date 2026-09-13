'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  adminSeatStatus,
  isSelectable,
  orderIdAt,
  selectionAction,
  type AdminSeatStatus,
  type SeatOccupancy,
  type SelectionAction,
} from '@/lib/admin/seatState'
import { nextSeatId, type Direction } from '@/lib/navigation'
import type { Seat } from '@/lib/types'
import type { Venue } from '@/lib/venue'

const ARROWS: Record<string, Direction> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
}

export interface AdminMap {
  statusOf: (seat: Seat) => AdminSeatStatus
  focusedId: string
  selectedIds: Set<string>
  selectedCount: number
  action: SelectionAction
  openOrderId: string | null
  activate: (seat: Seat) => void
  clear: () => void
  closeOrder: () => void
  onSeatFocus: (id: string) => void
  onKeyDown: (event: React.KeyboardEvent<SVGSVGElement>) => void
}

export function useAdminMap(
  venue: Venue,
  occupancy: Map<string, SeatOccupancy>,
): AdminMap {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [openOrderId, setOpenOrderId] = useState<string | null>(null)
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

  const activate = useCallback(
    (seat: Seat) => {
      if (!isSelectable(seat.id, occupancy)) {
        setSelectedIds(new Set())
        setOpenOrderId(orderIdAt(seat.id, occupancy))
        return
      }

      setOpenOrderId(null)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(seat.id)) next.delete(seat.id)
        else next.add(seat.id)
        return next
      })
    },
    [occupancy],
  )

  const clear = useCallback(() => setSelectedIds(new Set()), [])
  const closeOrder = useCallback(() => setOpenOrderId(null), [])

  const statusOf = useCallback(
    (seat: Seat): AdminSeatStatus => adminSeatStatus(seat.id, occupancy, selectedIds),
    [occupancy, selectedIds],
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
        if (seat) activate(seat)
      }
    },
    [activate, focusedId, venue],
  )

  const action = useMemo(
    () => selectionAction(selectedIds, occupancy),
    [selectedIds, occupancy],
  )

  return {
    statusOf,
    focusedId,
    selectedIds,
    selectedCount: selectedIds.size,
    action,
    openOrderId,
    activate,
    clear,
    closeOrder,
    onSeatFocus: setFocusedId,
    onKeyDown,
  }
}
