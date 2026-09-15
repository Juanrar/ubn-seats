'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const ADMIN_TABS = [
  { href: '/admin', label: 'Butacas' },
  { href: '/admin/ordenes', label: 'Órdenes' },
  { href: '/admin/cuenta', label: 'Cuenta' },
]

export function AdminTabs() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Secciones del panel"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-rule bg-paper pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-3xl">
        {ADMIN_TABS.map((tab) => {
          const active = pathname === tab.href
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`-mt-px flex h-14 items-center justify-center border-t-2 text-hand-base ${
                  active ? 'border-ink font-bold text-ink' : 'border-transparent font-medium text-ink-mute'
                }`}
              >
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
