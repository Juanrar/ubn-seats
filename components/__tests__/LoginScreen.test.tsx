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
})
