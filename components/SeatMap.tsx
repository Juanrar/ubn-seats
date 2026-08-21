'use client'

import { useMemo } from 'react'
import { SeatArc, type SeatArcProps } from '@/components/SeatArc'
import { Stage, STAGE_BOX } from '@/components/Stage'
import { boundingBox } from '@/lib/geometry'
import { round3, seatBounds } from '@/lib/seats'
import type { Seat } from '@/lib/types'

export interface SeatMapProps extends SeatArcProps {
  onKeyDown?: (event: React.KeyboardEvent<SVGSVGElement>) => void
}

/** Agrupa las plazas por fila, en el orden del plano. */
function byRow(seats: Seat[]): [number, Seat[]][] {
  const groups = new Map<number, Seat[]>()
  for (const seat of seats) {
    const list = groups.get(seat.row)
    if (list) list.push(seat)
    else groups.set(seat.row, [seat])
  }
  return [...groups.entries()].sort((a, b) => a[0] - b[0])
}

export function SeatMap({ seats, onKeyDown, ...arcProps }: SeatMapProps) {
  const viewBox = useMemo(() => {
    const seatsBox = seatBounds(seats)
    const box = boundingBox(
      [
        { x: seatsBox.x, y: seatsBox.y },
        { x: seatsBox.x + seatsBox.width, y: seatsBox.y + seatsBox.height },
        { x: STAGE_BOX.x, y: STAGE_BOX.y },
        { x: STAGE_BOX.x + STAGE_BOX.width, y: STAGE_BOX.y + STAGE_BOX.height },
      ],
      24,
    )
    return `${round3(box.x)} ${round3(box.y)} ${round3(box.width)} ${round3(box.height)}`
  }, [seats])

  const rows = useMemo(() => byRow(seats), [seats])

  return (
    <svg
      role="group"
      aria-label="Mapa de butacas de la Platea"
      viewBox={viewBox}
      onKeyDown={onKeyDown}
      className="h-auto w-full touch-pan-y select-none"
    >
      <Stage />
      {rows.map(([row, rowSeats]) => (
        <SeatArc key={row} seats={rowSeats} {...arcProps} />
      ))}
    </svg>
  )
}
