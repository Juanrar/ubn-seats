'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Legend } from '@/components/Legend'
import { SeatMap } from '@/components/SeatMap'
import { SelectionPanel } from '@/components/SelectionPanel'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useSeatSelection } from '@/hooks/useSeatSelection'
import { nextSeatId, type Direction } from '@/lib/navigation'
import { buildOccupancy } from '@/lib/occupancy'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import type { Seat, SeatStatus } from '@/lib/types'
import { buildVenue } from '@/lib/venue'

const ARROWS: Record<string, Direction> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
}

export function PlateaPicker() {
  const venue = useMemo(() => buildVenue(TEATRO_DEL_GLOBO), [])
  const occupied = useMemo(() => buildOccupancy(venue.seats), [venue])

  const { selectedIds, toggle, clear, limitReached } = useSeatSelection(occupied)
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

  const statusOf = useCallback(
    (seat: Seat): SeatStatus => {
      if (occupied.has(seat.id)) return 'occupied'
      return selectedIds.has(seat.id) ? 'selected' : 'available'
    },
    [occupied, selectedIds],
  )

  const handleKeyDown = useCallback(
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
    () => venue.seats.filter((s) => selectedIds.has(s.id)),
    [selectedIds, venue],
  )

  return (
    <div className="mx-auto flex w-full max-w-[var(--layout-stack)] flex-col gap-8 px-5 py-10">
      <header className="flex items-start justify-between gap-4 border-b border-rule pb-5">
        <div>
          <h1 className="text-2xl">{venue.plan.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Sector {venue.plan.sectionName} · elegí dónde sentarte
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="-mx-5 overflow-x-auto px-5">
            <div className="min-w-[560px]">
              <SeatMap
                venue={venue}
                statusOf={statusOf}
                focusedId={focusedId}
                onToggle={toggle}
                onFocus={setFocusedId}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
          <Legend geometry={venue.plan.geometry} />
          <p className="font-hand text-base text-ink-mute">
            usá las flechas para moverte y Enter para elegir
          </p>
        </div>

        <aside className="w-full shrink-0 border-t border-rule pt-5 lg:sticky lg:top-8 lg:w-72 lg:border-t-0 lg:pt-0">
          <SelectionPanel
            seats={selectedSeats}
            limitReached={limitReached}
            onRemove={toggle}
            onClear={clear}
          />
        </aside>
      </div>
    </div>
  )
}
