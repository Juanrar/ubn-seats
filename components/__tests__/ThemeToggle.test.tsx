import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '@/components/ThemeToggle'
import { THEME_STORAGE_KEY } from '@/lib/theme'

function mockPrefersDark(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    mockPrefersDark(false)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sólo ofrece Claro y Oscuro, sin la opción Sistema', () => {
    render(<ThemeToggle />)
    expect(screen.getAllByRole('radio')).toHaveLength(2)
    expect(screen.getByRole('radio', { name: /claro/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /oscuro/i })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /sistema/i })).not.toBeInTheDocument()
  })

  it('sin preferencia guardada, marca activo el que coincide con el sistema', () => {
    mockPrefersDark(true)
    render(<ThemeToggle />)
    expect(screen.getByRole('radio', { name: /oscuro/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('al elegir Oscuro lo guarda y lo marca activo', async () => {
    render(<ThemeToggle />)
    await userEvent.click(screen.getByRole('radio', { name: /oscuro/i }))
    expect(screen.getByRole('radio', { name: /oscuro/i })).toHaveAttribute('aria-checked', 'true')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })
})
