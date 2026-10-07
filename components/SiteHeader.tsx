import type { ReactNode } from 'react'
import { MyTicketsLink, type MyTicketsLinkProps } from '@/components/MyTicketsLink'
import { UserMenu } from '@/components/UserMenu'

export interface SiteHeaderProps {
  leading: ReactNode
  title: ReactNode
  email: string
  avatarUrl: string | null
  myTickets?: MyTicketsLinkProps
  stickyOnMobile?: boolean
}

const STICKY_ON_MOBILE =
  'max-sm:sticky max-sm:top-0 max-sm:z-30 max-sm:-mx-5 max-sm:-mt-3 max-sm:bg-paper max-sm:px-5 max-sm:pt-[max(0.75rem,env(safe-area-inset-top))] max-sm:pb-3'

const CENTERED_GRID = 'grid-cols-[1fr_auto_1fr] gap-4'
const CENTERED_TITLE = 'text-center text-hand-h2 whitespace-nowrap'
const GRID_WITH_TICKETS = 'grid-cols-[auto_1fr_auto] gap-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-4'
const TITLE_WITH_TICKETS =
  'text-hand-lead leading-none text-balance sm:text-center sm:text-hand-h2 sm:whitespace-nowrap'

export function SiteHeader({
  leading,
  title,
  email,
  avatarUrl,
  myTickets,
  stickyOnMobile = false,
}: SiteHeaderProps) {
  const showsTickets = myTickets !== undefined && myTickets.count > 0

  return (
    <header
      className={`grid items-center border-b border-rule pb-5 ${showsTickets ? GRID_WITH_TICKETS : CENTERED_GRID} ${
        stickyOnMobile ? STICKY_ON_MOBILE : ''
      }`}
    >
      <div className="justify-self-start">{leading}</div>
      <h1 className={`font-bold ${showsTickets ? TITLE_WITH_TICKETS : CENTERED_TITLE}`}>{title}</h1>
      <div className="flex items-center gap-1.5 justify-self-end sm:gap-4">
        {showsTickets && <MyTicketsLink {...myTickets} />}
        <UserMenu email={email} avatarUrl={avatarUrl} />
      </div>
    </header>
  )
}
