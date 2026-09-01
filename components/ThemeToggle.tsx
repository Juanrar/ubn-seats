'use client'

import { useEffect, useState } from 'react'
import {
  parseThemePref,
  resolveTheme,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  type ThemePref,
} from '@/lib/theme'

const LABELS: Record<ThemePref, string> = {
  light: 'Claro',
  dark: 'Oscuro',
  system: 'Sistema',
}

const ORDER: ThemePref[] = ['light', 'dark', 'system']

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

  function cycle() {
    const next = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length]
    setPref(next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
    }
    apply(next)
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Tema: ${LABELS[pref]}. Tocá para cambiar.`}
      className="min-h-11 border-b border-transparent px-1 font-ui text-ui-xs text-ink-mute transition-colors hover:border-ink hover:text-ink"
    >
      {LABELS[pref]}
    </button>
  )
}
