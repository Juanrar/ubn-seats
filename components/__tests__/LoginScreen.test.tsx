import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const signInWithOAuth = vi.fn()
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({ auth: { signInWithOAuth } }),
}))

import { LoginScreen } from '@/components/LoginScreen'

describe('LoginScreen', () => {
  it('muestra el botón de Google', () => {
    render(<LoginScreen />)
    expect(screen.getByRole('button', { name: /iniciar sesión con google/i })).toBeInTheDocument()
  })

  it('dispara signInWithOAuth con provider google al clickear', async () => {
    render(<LoginScreen />)
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión con google/i }))
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  })

  it('muestra el logo de la compañía con nombre accesible', () => {
    render(<LoginScreen />)
    expect(screen.getByRole('img', { name: /logo de la compañía/i })).toBeInTheDocument()
  })

  it('encabeza la pantalla con la invitación a elegir butaca', () => {
    render(<LoginScreen />)
    expect(screen.getByRole('heading', { name: /una butaca a tu nombre/i })).toBeInTheDocument()
  })

  it('no le anuncia las ondas decorativas al lector de pantalla', () => {
    const { container } = render(<LoginScreen />)
    const ripples = container.querySelector('svg[data-login-ripples]')
    expect(ripples).toHaveAttribute('aria-hidden', 'true')
  })
})
