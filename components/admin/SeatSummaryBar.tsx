import type { SeatSummary } from '@/lib/admin/seatState'

const SUMMARY_ITEMS: { key: keyof SeatSummary; label: string }[] = [
  { key: 'sold', label: 'vendidas' },
  { key: 'blocked', label: 'bloqueadas' },
  { key: 'free', label: 'libres' },
]

export function SeatSummaryBar({ summary }: { summary: SeatSummary }) {
  return (
    <dl className="grid grid-cols-3 gap-2">
      {SUMMARY_ITEMS.map((item) => (
        <div key={item.key} className="flex flex-col-reverse rounded-md border border-rule px-3 py-2">
          <dt className="text-hand-xs text-ink-mute">{item.label}</dt>
          <dd className="font-mono text-[15px]">{summary[item.key]}</dd>
        </div>
      ))}
    </dl>
  )
}
