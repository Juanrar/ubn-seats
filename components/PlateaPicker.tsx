'use client'

import { useMemo } from 'react'
import { Legend } from '@/components/Legend'
import { SeatMap } from '@/components/SeatMap'
import { SelectionPanel } from '@/components/SelectionPanel'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useSeatPicker } from '@/hooks/useSeatPicker'
import { buildOccupancy } from '@/lib/occupancy'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'

export function PlateaPicker() {
  const venue = useMemo(() => buildVenue(TEATRO_DEL_GLOBO), [])
  const occupied = useMemo(() => buildOccupancy(venue.seats), [venue])
  const picker = useSeatPicker(venue, occupied)

  return (
    <div className="mx-auto flex w-full max-w-[var(--layout-stack)] flex-col gap-8 px-5 py-10">
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
    </div>
  )
}
