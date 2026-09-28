'use client'

import { useRef, type MouseEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { performanceParts, type Performance } from '@/lib/performance'

const PERFORMANCES_PATH = '/'

export interface BackToPerformancesProps {
  selectionCount: number
  performance: Performance
}

function selectionText(count: number): string {
  return count === 1 ? '1 butaca elegida' : `${count} butacas elegidas`
}

export function BackToPerformances({ selectionCount, performance }: BackToPerformancesProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const router = useRouter()
  const { weekday, day } = performanceParts(performance.startsAt)

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (selectionCount === 0) return
    event.preventDefault()
    dialogRef.current?.showModal()
  }

  function leave() {
    dialogRef.current?.close()
    router.push(PERFORMANCES_PATH)
  }

  return (
    <>
      <Link
        href={PERFORMANCES_PATH}
        onClick={handleClick}
        aria-label="Volver a las funciones"
        className="-ml-2.5 inline-flex min-h-11 min-w-11 items-center gap-1 rounded-sm px-2.5 text-ink transition-colors hover:text-accent active:text-accent"
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="shrink-0"
        >
          <path d="M19.5 12H5" />
          <path d="M11 18l-6-6 6-6" />
        </svg>
        <span className="text-hand-base max-sm:hidden">Funciones</span>
      </Link>

      <dialog
        ref={dialogRef}
        aria-labelledby="volver-titulo"
        className="m-auto w-[min(420px,calc(100vw-2rem))] rounded-sm border border-rule bg-paper px-5 pt-6 pb-5 text-ink backdrop:bg-paper/75"
      >
        <h2 id="volver-titulo" className="text-hand-h2 font-semibold">
          ¿Volver a las funciones?
        </h2>
        <p className="mt-3 text-hand-base text-ink-soft">
          Tenés {selectionText(selectionCount)} para el {weekday.toLowerCase()} {day}. Si volvés, se
          pierde la selección.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-sm border border-rule px-4 py-2 text-hand-base text-ink hover:border-ink-mute"
          >
            Seguir eligiendo
          </button>
          <button
            type="button"
            onClick={leave}
            className="rounded-sm bg-accent px-4 py-2 text-hand-base text-paper transition-colors hover:bg-accent-soft"
          >
            Volver igual
          </button>
        </div>
      </dialog>
    </>
  )
}
