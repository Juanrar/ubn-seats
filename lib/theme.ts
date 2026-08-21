export type ThemePref = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'theme'

export const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#f1e8d3',
  dark: '#1f1c16',
}

/** Normaliza lo que venga de localStorage. Cualquier basura cae en 'system'. */
export function parseThemePref(value: unknown): ThemePref {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
}

/** Preferencia + estado del sistema => tema efectivo. */
export function resolveTheme(pref: ThemePref, prefersDark: boolean): ResolvedTheme {
  if (pref === 'light' || pref === 'dark') return pref
  return prefersDark ? 'dark' : 'light'
}
