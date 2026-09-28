import type { ReactNode } from 'react'
import { UserMenu } from '@/components/UserMenu'

export interface SiteHeaderProps {
  leading: ReactNode
  title: ReactNode
  email: string
  avatarUrl: string | null
  stickyOnMobile?: boolean
}

const STICKY_ON_MOBILE =
  'max-sm:sticky max-sm:top-0 max-sm:z-30 max-sm:-mx-5 max-sm:-mt-3 max-sm:bg-paper max-sm:px-5 max-sm:pt-[max(0.75rem,env(safe-area-inset-top))] max-sm:pb-3'

export function SiteHeader({ leading, title, email, avatarUrl, stickyOnMobile = false }: SiteHeaderProps) {
  return (
    <header
      className={`grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-rule pb-5 ${
        stickyOnMobile ? STICKY_ON_MOBILE : ''
      }`}
    >
      <div className="justify-self-start">{leading}</div>
      <h1 className="text-center text-hand-h2 font-bold whitespace-nowrap">{title}</h1>
      <div className="justify-self-end">
        <UserMenu email={email} avatarUrl={avatarUrl} />
      </div>
    </header>
  )
}
