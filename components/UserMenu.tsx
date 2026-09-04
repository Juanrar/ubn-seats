'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { createClient } from '@/utils/supabase/client'

export interface UserMenuProps {
  email: string
  avatarUrl: string | null
}

export function UserMenu({ email, avatarUrl }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement>(null)
  const initial = email.charAt(0).toUpperCase()

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Menú de usuario"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-rule bg-accent text-hand-sm text-paper"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Menú de usuario"
          className="absolute right-0 top-10 z-10 flex w-56 flex-col gap-3 rounded-sm border border-rule bg-paper p-3 text-hand-sm"
        >
          <p className="truncate text-ink-mute">{email}</p>
          <ThemeToggle />
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="border-t border-rule pt-3 text-left text-ink hover:text-accent"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
