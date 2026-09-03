'use client'

import { useEffect, useState } from 'react'
import {
  parseThemePref,
  resolveTheme,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  type ThemePref,
} from '@/lib/theme'

function SunIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="2.8" />
      <line x1="8" y1="1.4" x2="8" y2="3.2" />
      <line x1="8" y1="12.8" x2="8" y2="14.6" />
      <line x1="1.4" y1="8" x2="3.2" y2="8" />
      <line x1="12.8" y1="8" x2="14.6" y2="8" />
      <line x1="3.33" y1="3.33" x2="4.61" y2="4.61" />
      <line x1="11.39" y1="11.39" x2="12.67" y2="12.67" />
      <line x1="12.67" y1="3.33" x2="11.39" y2="4.61" />
      <line x1="4.61" y1="11.39" x2="3.33" y2="12.67" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 8.53A6 6 0 1 1 7.47 2 4.67 4.67 0 0 0 14 8.53Z" />
    </svg>
  )
}

function SystemIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="12" height="8" rx="1" />
      <line x1="6" y1="13" x2="10" y2="13" />
      <line x1="8" y1="11" x2="8" y2="13" />
    </svg>
  )
}

const OPTIONS: { value: ThemePref; label: string; Icon: () => React.JSX.Element }[] = [
  { value: 'light', label: 'Claro', Icon: SunIcon },
  { value: 'dark', label: 'Oscuro', Icon: MoonIcon },
  { value: 'system', label: 'Sistema', Icon: SystemIcon },
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
    <div
      role="radiogroup"
      aria-label="Tema"
      className="flex items-center gap-px rounded-sm border border-rule"
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={pref === value}
          aria-label={label}
          title={label}
          onClick={() => choose(value)}
          className={`flex h-7 w-7 items-center justify-center transition-colors ${
            pref === value ? 'bg-accent text-paper' : 'text-ink-mute hover:text-accent'
          }`}
        >
          <Icon />
        </button>
      ))}
    </div>
  )
}
