import Link from 'next/link'

const MY_TICKETS_PATH = '/mis-entradas'

export interface MyTicketsLinkProps {
  count: number
  current?: boolean
}

function ticketCountText(count: number): string {
  return count === 1 ? '1 entrada' : `${count} entradas`
}

function TicketIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M3.5 8A1.5 1.5 0 0 1 5 6.5h14A1.5 1.5 0 0 1 20.5 8v2.25a1.75 1.75 0 0 0 0 3.5V16a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 16v-2.25a1.75 1.75 0 0 0 0-3.5Z" />
      <path d="M15 7.5v1.25M15 11.4v1.2M15 15.25v1.25" />
    </svg>
  )
}

export function MyTicketsLink({ count, current = false }: MyTicketsLinkProps) {
  const hasTickets = count > 0

  return (
    <Link
      href={MY_TICKETS_PATH}
      aria-current={current ? 'page' : undefined}
      aria-label={hasTickets ? `Mis entradas, ${ticketCountText(count)}` : 'Mis entradas'}
      className={`inline-flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-sm px-1 text-ink transition-colors hover:text-accent sm:flex-row sm:gap-2 sm:border sm:px-3 sm:hover:border-accent ${
        current ? 'sm:border-ink' : 'sm:border-rule'
      }`}
    >
      <span className="relative">
        <TicketIcon />
        {hasTickets && (
          <span className="absolute -top-2 -right-3 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 font-mono text-[0.8125rem] leading-none text-paper sm:hidden">
            {count}
          </span>
        )}
      </span>
      <span className="text-hand-xs leading-none sm:hidden">Entradas</span>
      <span className="text-hand-base max-sm:hidden">Mis entradas</span>
      {hasTickets && (
        <span className="rounded-sm border border-rule px-1.5 font-mono text-[0.8125rem] leading-5 text-ink-soft max-sm:hidden">
          {count}
        </span>
      )}
    </Link>
  )
}
