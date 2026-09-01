'use client'

import { useMemo, useState } from 'react'
import { Confirmation } from '@/components/Confirmation'
import { RowBand } from '@/components/RowBand'
import { RowRule } from '@/components/RowRule'
import { SelectionBar } from '@/components/SelectionBar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { VenueMap } from '@/components/VenueMap'
import { useRowFocus } from '@/hooks/useRowFocus'
import { useSeatPicker } from '@/hooks/useSeatPicker'
import { buildOccupancy } from '@/lib/occupancy'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'

export function PlateaPicker() {
  const venue = useMemo(() => buildVenue(TEATRO_DEL_GLOBO), [])
  const occupied = useMemo(() => buildOccupancy(venue.seats), [venue])
  const picker = useSeatPicker(venue, occupied)
  const rows = useRowFocus(venue)
  const [confirming, setConfirming] = useState(false)

  function pickRow(row: number) {
    rows.setActiveRow(row)
    const nextRow = venue.rows.find((candidate) => candidate.row === row)
    if (nextRow) picker.onSeatFocus(nextRow.seats[0].id)
  }

  if (confirming) {
    return (
      <Confirmation
        seats={picker.selectedSeats}
        total={picker.total}
        venueName={venue.plan.name}
        sectionName={venue.plan.sectionName}
        onBack={() => setConfirming(false)}
      />
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-baseline justify-between gap-3 px-5 pt-5">
        <div className="flex flex-col">
          <span className="font-hand text-hand-h2 leading-none text-ink">
            {venue.plan.name}
          </span>
          <span className="font-ui text-ui-sm text-ink-mute">{venue.plan.sectionName}</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="min-h-0 flex-1 px-5 py-3">
        <VenueMap
          venue={venue}
          statusOf={picker.statusOf}
          activeRow={rows.activeRow}
          onPickRow={pickRow}
        />
      </div>

      <div className="flex flex-col gap-3 px-5">
        <RowBand
          venue={venue}
          row={rows.row}
          statusOf={picker.statusOf}
          focusedId={picker.focusedId}
          onToggle={picker.toggle}
          onFocus={(id) => {
            picker.onSeatFocus(id)
            rows.focusSeatRow(id)
          }}
          onKeyDown={picker.onKeyDown}
        />
        <p id="band-hint" className="font-ui text-ui-xs text-ink-mute">
          Tocá una butaca para elegirla. Con el teclado, usá las flechas y Enter.
        </p>
        <RowRule venue={venue} activeRow={rows.activeRow} onChange={pickRow} />
      </div>

      <div className="sticky bottom-0">
        <SelectionBar
          seats={picker.selectedSeats}
          total={picker.total}
          maxSeats={venue.maxSeats}
          rejection={picker.rejection}
          onClear={picker.clear}
          onContinue={() => setConfirming(true)}
        />
      </div>
    </div>
  )
}
