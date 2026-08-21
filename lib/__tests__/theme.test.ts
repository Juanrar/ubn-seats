import { describe, it, expect } from 'vitest'
import { parseThemePref, resolveTheme, THEME_COLORS } from '@/lib/theme'

describe('parseThemePref', () => {
  it('acepta los tres valores válidos', () => {
    expect(parseThemePref('light')).toBe('light')
    expect(parseThemePref('dark')).toBe('dark')
    expect(parseThemePref('system')).toBe('system')
  })

  it('cae en system ante cualquier otra cosa', () => {
    for (const v of [null, undefined, '', 'DARK', 42, {}]) {
      expect(parseThemePref(v)).toBe('system')
    }
  })
})

describe('resolveTheme', () => {
  it('respeta la preferencia explícita por encima del sistema', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('sigue al sistema cuando la preferencia es system', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
})

describe('THEME_COLORS', () => {
  it('usa los colores de papel de la referencia', () => {
    expect(THEME_COLORS.light).toBe('#f1e8d3')
    expect(THEME_COLORS.dark).toBe('#1f1c16')
  })
})
