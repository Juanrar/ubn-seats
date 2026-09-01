'use client'

import { useEffect, useState } from 'react'
import {
  parseThemePref,
  resolveTheme,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  type ThemePref,
} from '@/lib/theme'

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'system', label: 'Sistema' },
]

function apply(pref: ThemePref): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = resolveTheme(pref, prefersDark)
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLORS[resolved])
}

export function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>('system')

  useEffect(() => {
    try {
      setPref(parseThemePref(localStorage.getItem(THEME_STORAGE_KEY)))
    } catch {
      setPref('system')
    }
  }, [])

  function choose(next: ThemePref) {
    setPref(next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
    }
    apply(next)
  }

  return (
    <div role="radiogroup" aria-label="Tema" className="flex items-center gap-3 font-ui text-ui-xs">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={pref === option.value}
          onClick={() => choose(option.value)}
          className={`border-b pb-0.5 transition-colors ${
            pref === option.value
              ? 'border-ink text-ink'
              : 'border-transparent text-ink-mute hover:text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
