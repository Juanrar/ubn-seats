import { SEAT_HEIGHT, SEAT_WIDTH } from '@/lib/constants'
import { SeatShape } from '@/components/Seat'
import type { Seat, SeatStatus } from '@/lib/types'

const ITEMS: { status: SeatStatus; kind: Seat['kind']; label: string }[] = [
  { status: 'available', kind: 'standard', label: 'Disponible' },
  { status: 'selected', kind: 'standard', label: 'Seleccionada' },
  { status: 'occupied', kind: 'standard', label: 'Ocupada' },
  { status: 'available', kind: 'accessible', label: 'Accesible' },
]

export function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-ink-mute">
      {ITEMS.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <svg
            width={SEAT_WIDTH}
            height={SEAT_HEIGHT}
            viewBox={`${-SEAT_WIDTH / 2} ${-SEAT_HEIGHT / 2} ${SEAT_WIDTH} ${SEAT_HEIGHT}`}
            aria-hidden="true"
            className="shrink-0 overflow-visible"
          >
            <SeatShape status={item.status} kind={item.kind} />
          </svg>
          {item.label}
        </li>
      ))}
    </ul>
  )
}
