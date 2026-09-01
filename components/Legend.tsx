import { SeatShape } from '@/components/Seat'
import type { GeometryPlan, SeatStatus } from '@/lib/types'

const ITEMS: { status: SeatStatus; label: string }[] = [
  { status: 'available', label: 'Disponible' },
  { status: 'selected', label: 'Seleccionada' },
  { status: 'occupied', label: 'Ocupada' },
]

export interface LegendProps {
  geometry: GeometryPlan
}

export function Legend({ geometry }: LegendProps) {
  const { seatWidth, seatHeight } = geometry
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-hand-sm text-ink-mute">
      {ITEMS.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <svg
            width={seatWidth}
            height={seatHeight}
            viewBox={`${-seatWidth / 2} ${-seatHeight / 2} ${seatWidth} ${seatHeight}`}
            aria-hidden="true"
            className="shrink-0 overflow-visible"
          >
            <SeatShape
              status={item.status}
              width={seatWidth}
              height={seatHeight}
              tierWeight={1}
            />
          </svg>
          {item.label}
        </li>
      ))}
    </ul>
  )
}
