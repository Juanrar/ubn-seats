'use client'

import { useMemo } from 'react'
import { Legend } from '@/components/Legend'
import { SeatMap } from '@/components/SeatMap'
import { SelectionBar } from '@/components/SelectionBar'
import { SelectionPanel } from '@/components/SelectionPanel'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useReservation } from '@/hooks/useReservation'
import { useSeatPicker } from '@/hooks/useSeatPicker'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildRevealDelays } from '@/lib/reveal'
import { buildVenue } from '@/lib/venue'

export interface PlateaPickerProps {
  occupied: Set<string>
}

export function PlateaPicker({ occupied }: PlateaPickerProps) {
  const venue = useMemo(() => buildVenue(TEATRO_DEL_GLOBO), [])
  const revealDelays = useMemo(() => buildRevealDelays(venue.seats, venue.stage), [venue])
  const picker = useSeatPicker(venue, occupied)
  const reservation = useReservation(picker.clear)

  return (
    <div
      className={`mx-auto flex w-full max-w-[var(--layout-stack)] flex-col gap-8 px-5 py-10 ${
        picker.selectedSeats.length > 0 ? 'pb-28' : ''
      }`}
    >
      <header className="flex items-center justify-between gap-4 border-b border-rule pb-5">
        <h1 className="text-hand-h2 font-bold">{venue.plan.name}</h1>
        <ThemeToggle />
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="-mx-5 overflow-x-auto px-5">
            <div className="min-w-[560px]">
              <SeatMap
                venue={venue}
                statusOf={picker.statusOf}
                focusedId={picker.focusedId}
                onToggle={picker.toggle}
                onFocus={picker.onSeatFocus}
                onKeyDown={picker.onKeyDown}
                revealDelayOf={(seat) => revealDelays.get(seat.id) ?? 0}
              />
            </div>
          </div>
          <Legend geometry={venue.plan.geometry} />
          <p className="text-hand-base text-ink-mute">
            Sector {venue.plan.sectionName} · usá las flechas para moverte y Enter para elegir
          </p>
        </div>

        <aside className="w-full shrink-0 border-t border-rule pt-5 lg:sticky lg:top-8 lg:w-72 lg:border-t-0 lg:pt-0">
          <SelectionPanel
            seats={picker.selectedSeats}
            total={picker.total}
            maxSeats={venue.maxSeats}
            limitReached={picker.limitReached}
            onRemove={picker.toggle}
            onClear={picker.clear}
          />
        </aside>
      </div>

      <SelectionBar
        seats={picker.selectedSeats}
        total={picker.total}
        status={reservation.status}
        errorMessage={reservation.errorMessage}
        onContinue={() => reservation.confirm(picker.selectedSeats.map((seat) => seat.id))}
      />
    </div>
  )
}
