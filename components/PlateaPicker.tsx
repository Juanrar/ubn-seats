'use client'

import { useMemo } from 'react'
import { BackToPerformances } from '@/components/BackToPerformances'
import { Legend } from '@/components/Legend'
import { SeatButton } from '@/components/Seat'
import { SeatMap } from '@/components/SeatMap'
import { SelectionBar } from '@/components/SelectionBar'
import { SelectionPanel } from '@/components/SelectionPanel'
import { SiteHeader } from '@/components/SiteHeader'
import { useReservation } from '@/hooks/useReservation'
import { useSeatPicker } from '@/hooks/useSeatPicker'
import { formatPerformanceShort, performanceParts, type Performance } from '@/lib/performance'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildRevealDelays } from '@/lib/reveal'
import { buildVenue } from '@/lib/venue'

export interface PlateaPickerProps {
  performance: Performance
  occupied: Set<string>
  owned?: ReadonlySet<string>
  email: string
  avatarUrl: string | null
}

export function PlateaPicker({ performance, occupied, owned, email, avatarUrl }: PlateaPickerProps) {
  const venue = useMemo(() => buildVenue(TEATRO_DEL_GLOBO), [])
  const revealDelays = useMemo(() => buildRevealDelays(venue.seats, venue.stage), [venue])
  const picker = useSeatPicker(venue, occupied, owned)
  const reservation = useReservation()
  const { weekday, day, monthNumber, time } = performanceParts(performance.startsAt)

  return (
    <div
      className={`mx-auto flex w-full max-w-[var(--layout-stack)] flex-col gap-6 px-5 py-3 ${
        picker.selectedSeats.length > 0 ? 'pb-28' : ''
      }`}
    >
      <SiteHeader
        stickyOnMobile
        leading={
          <BackToPerformances
            selectionCount={picker.selectedSeats.length}
            performance={performance}
          />
        }
        title={
          <>
            {weekday} {day}/{monthNumber}
            <span className="block text-hand-sm font-medium text-ink-mute">
              {time} · {venue.plan.sectionName}
            </span>
          </>
        }
        email={email}
        avatarUrl={avatarUrl}
      />

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="-mx-5 overflow-x-auto px-5">
            <div className="min-w-[560px]">
              <SeatMap
                venue={venue}
                onKeyDown={picker.onKeyDown}
                renderSeat={(seat, geometry) => (
                  <SeatButton
                    seat={seat}
                    geometry={geometry}
                    status={picker.statusOf(seat)}
                    focused={seat.id === picker.focusedId}
                    onToggle={picker.toggle}
                    onFocus={picker.onSeatFocus}
                    revealDelayMs={revealDelays.get(seat.id) ?? 0}
                  />
                )}
              />
            </div>
          </div>
          <Legend geometry={venue.plan.geometry} />
          {owned && owned.size > 0 && (
            <p className="text-hand-base">Ya tenés {owned.size} entradas para esta función.</p>
          )}
          <p className="text-hand-base text-ink-mute">
            Sector {venue.plan.sectionName} · elegí tocando una butaca; deslizá para ver toda la
            sala
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
        performanceLabel={formatPerformanceShort(performance.startsAt)}
        seats={picker.selectedSeats}
        total={picker.total}
        status={reservation.status}
        errorMessage={reservation.errorMessage}
        onContinue={() =>
          reservation.confirm(
            performance.id,
            picker.selectedSeats.map((seat) => seat.id),
          )
        }
      />
    </div>
  )
}
