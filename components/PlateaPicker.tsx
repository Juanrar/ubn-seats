'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Legend } from '@/components/Legend'
import { SeatMap } from '@/components/SeatMap'
import { SelectionPanel } from '@/components/SelectionPanel'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useSeatSelection } from '@/hooks/useSeatSelection'
import { nextSeatId, type Direction } from '@/lib/navigation'
import { buildOccupancy } from '@/lib/occupancy'
import { buildSeats } from '@/lib/seats'
import type { Seat, SeatStatus } from '@/lib/types'

const ARROWS: Record<string, Direction> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
}

export function PlateaPicker() {
  // El catálogo y la ocupación son deterministas: se calculan una sola vez y
  // dan lo mismo en el servidor que en el cliente.
  const seats = useMemo(() => buildSeats(), [])
  const occupied = useMemo(() => buildOccupancy(seats), [seats])
  const byId = useMemo(() => new Map(seats.map((s) => [s.id, s])), [seats])

  const { selectedIds, toggle, clear, limitReached } = useSeatSelection(occupied)
  const [focusedId, setFocusedId] = useState<string>(() => seats[0].id)
  const pendingFocus = useRef<string | null>(null)

  // Cuando el teclado mueve el foco lógico, hay que mover también el foco real
  // del DOM: el roving tabindex por sí solo no lo hace.
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
        const next = nextSeatId(seats, focusedId, direction)
        if (next !== focusedId) {
          setFocusedId(next)
          pendingFocus.current = next
        }
        return
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        const seat = byId.get(focusedId)
        if (seat) toggle(seat)
      }
    },
    [byId, focusedId, seats, toggle],
  )

  const selectedSeats = useMemo(
    () => seats.filter((s) => selectedIds.has(s.id)),
    [seats, selectedIds],
  )

  return (
    <div className="mx-auto flex w-full max-w-[var(--layout-stack)] flex-col gap-8 px-5 py-10">
      <header className="flex items-start justify-between gap-4 border-b border-rule pb-5">
        <div>
          <h1 className="text-2xl">Teatro del Globo</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Sector Platea · elegí dónde sentarte
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {/*
            En pantallas angostas el mapa no se comprime hasta volverse
            intocable: se le da un ancho mínimo y el contenedor scrollea.
          */}
          <div className="-mx-5 overflow-x-auto px-5">
            <div className="min-w-[560px]">
              <SeatMap
                seats={seats}
                statusOf={statusOf}
                focusedId={focusedId}
                onToggle={toggle}
                onFocus={setFocusedId}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
          <Legend />
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
