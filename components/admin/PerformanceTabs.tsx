import Link from 'next/link'
import { formatPerformanceShort, type Performance } from '@/lib/performance'

export interface PerformanceTabsProps {
  performances: Performance[]
  selectedId: string
}

export function PerformanceTabs({ performances, selectedId }: PerformanceTabsProps) {
  return (
    <nav aria-label="Funciones">
      <ul className="flex overflow-hidden rounded-md border border-rule">
        {performances.map((performance) => {
          const selected = performance.id === selectedId
          return (
            <li key={performance.id} className="flex-1 border-rule not-first:border-l">
              <Link
                href={`/admin?funcion=${performance.id}`}
                aria-current={selected ? 'page' : undefined}
                className={`flex min-h-11 items-center justify-center border-b-2 px-3 text-hand-base ${
                  selected
                    ? 'border-ink bg-paper-2 font-bold text-ink'
                    : 'border-transparent font-medium text-ink-mute'
                }`}
              >
                {formatPerformanceShort(performance.startsAt)}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
