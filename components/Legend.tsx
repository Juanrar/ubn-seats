import { SeatShape } from '@/components/Seat'
import type { GeometryPlan, Seat, SeatStatus } from '@/lib/types'

const ITEMS: { status: SeatStatus; kind: Seat['kind']; label: string }[] = [
  { status: 'available', kind: 'standard', label: 'Disponible' },
  { status: 'selected', kind: 'standard', label: 'Seleccionada' },
  { status: 'occupied', kind: 'standard', label: 'Ocupada' },
  { status: 'available', kind: 'accessible', label: 'Accesible' },
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
              kind={item.kind}
              width={seatWidth}
              height={seatHeight}
            />
          </svg>
          {item.label}
        </li>
      ))}
    </ul>
  )
}
