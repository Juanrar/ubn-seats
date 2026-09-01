'use client'

import { useCallback, useMemo, useState } from 'react'
import type { Venue, VenueRow } from '@/lib/venue'

export interface RowFocus {
  activeRow: number
  activeIndex: number
  row: VenueRow
  rowCount: number
  setActiveRow: (row: number) => void
  focusSeatRow: (seatId: string) => void
  step: (delta: number) => void
}

export function useRowFocus(venue: Venue): RowFocus {
  const firstRow = venue.rows[0].row
  const lastRow = venue.rows[venue.rows.length - 1].row
  const [activeRow, setRow] = useState(firstRow)

  const setActiveRow = useCallback(
    (row: number) => setRow(Math.min(lastRow, Math.max(firstRow, row))),
    [firstRow, lastRow],
  )

  const step = useCallback(
    (delta: number) => setRow((prev) => Math.min(lastRow, Math.max(firstRow, prev + delta))),
    [firstRow, lastRow],
  )

  const focusSeatRow = useCallback(
    (seatId: string) => {
      const seat = venue.byId.get(seatId)
      if (seat) setActiveRow(seat.row)
    },
    [setActiveRow, venue],
  )

  const row = useMemo(
    () => venue.rows.find((candidate) => candidate.row === activeRow) ?? venue.rows[0],
    [activeRow, venue],
  )

  const activeIndex = useMemo(
    () => venue.rows.findIndex((candidate) => candidate.row === activeRow),
    [activeRow, venue],
  )

  return {
    activeRow,
    activeIndex,
    row,
    rowCount: venue.rows.length,
    setActiveRow,
    focusSeatRow,
    step,
  }
}
