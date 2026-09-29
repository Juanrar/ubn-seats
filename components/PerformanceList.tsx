import Link from 'next/link'
import type { CSSProperties } from 'react'
import { SiteHeader } from '@/components/SiteHeader'
import { formatPerformanceDate, performanceParts, type Performance } from '@/lib/performance'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { SHOW } from '@/lib/show'

export interface PerformanceListProps {
  performances: Performance[]
  email: string
  avatarUrl: string | null
}

export function PerformanceList({ performances, email, avatarUrl }: PerformanceListProps) {
  return (
    <div className="mx-auto flex w-full max-w-[var(--layout-stack)] flex-col gap-7 px-5 py-3 sm:gap-6">
      <SiteHeader
        leading={<div role="img" aria-label="Logo de la compañía" className="brand-mark" />}
        title={TEATRO_DEL_GLOBO.name}
        email={email}
        avatarUrl={avatarUrl}
      />

      <section className="flex flex-col gap-2 sm:gap-1.5">
        <h2 className="text-hand-h1 font-bold text-balance">{SHOW.title}</h2>
        <p className="text-hand-base text-ink-soft">
          {SHOW.venue}
          <span className="max-sm:hidden"> · </span>
          <span className="max-sm:block max-sm:text-hand-sm max-sm:text-ink-mute">{SHOW.address}</span>
        </p>
      </section>

      <section aria-labelledby="funciones-titulo">
        <h3 id="funciones-titulo" className="border-b border-rule pb-2 text-hand-h2 font-semibold">
          Funciones
        </h3>
        {performances.length === 0 ? (
          <p className="pt-4 text-hand-base text-ink-mute">No hay funciones a la venta por ahora.</p>
        ) : (
          <ul className="flex flex-col">
            {performances.map((performance, index) => (
              <li
                key={performance.id}
                style={{ '--i': index } as CSSProperties}
                className="performance-drop border-b border-rule"
              >
                <PerformanceRow performance={performance} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function PerformanceRow({ performance }: { performance: Performance }) {
  const { weekday, day, monthShort, time } = performanceParts(performance.startsAt)

  return (
    <Link
      href={`/funciones/${performance.id}`}
      aria-label={`${formatPerformanceDate(performance.startsAt)}. Ver disponibilidad`}
      className="group -mx-2 grid w-[calc(100%+1rem)] grid-cols-[auto_1fr_auto] items-center gap-3.5 rounded-sm px-2 py-4 transition-colors active:bg-paper-2 max-[359px]:grid-cols-[auto_1fr] max-[359px]:gap-y-3 sm:mx-0 sm:w-full sm:grid-cols-[72px_1fr_auto] sm:gap-5 sm:px-1 sm:py-5 sm:active:bg-transparent"
    >
      <span className="flex min-w-11 flex-col items-center border-r border-rule-soft pr-3.5 sm:border-r-0 sm:pr-0">
        <span className="text-hand-h1 font-bold transition-colors sm:group-hover:text-accent">{day}</span>
        <span className="text-hand-sm text-ink-mute">{monthShort}</span>
      </span>
      <span className="flex min-w-0 flex-col text-hand-lead sm:flex-row sm:gap-1.5">
        <span>{weekday}</span>
        <span className="max-sm:hidden">·</span>
        <span className="max-sm:text-hand-sm max-sm:text-ink-mute">{time}</span>
      </span>
      <span className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-sm border border-accent px-3 text-hand-sm whitespace-nowrap text-accent transition group-active:bg-accent group-active:text-paper max-[359px]:col-span-full sm:min-h-0 sm:border-0 sm:px-0 sm:text-hand-base sm:group-hover:translate-x-1 sm:group-active:bg-transparent sm:group-active:text-accent">
        Ver disponibilidad
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="max-sm:hidden"
        >
          <path d="M4.5 12H19" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  )
}
