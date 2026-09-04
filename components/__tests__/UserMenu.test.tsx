import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const signOut = vi.fn()
const refresh = vi.fn()
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({ auth: { signOut } }),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

import { UserMenu } from '@/components/UserMenu'

describe('UserMenu', () => {
  it('muestra la inicial del email cuando no hay foto de avatar', () => {
    render(<UserMenu email="juanchilorenzo@gmail.com" avatarUrl={null} />)
    expect(screen.getByRole('button', { name: /menú de usuario/i })).toHaveTextContent('J')
  })

  it('muestra la foto de avatar cuando viene', () => {
    render(<UserMenu email="juanchilorenzo@gmail.com" avatarUrl="https://example.com/foto.jpg" />)
    const boton = screen.getByRole('button', { name: /menú de usuario/i })
    expect(boton.querySelector('img')).toHaveAttribute('src', 'https://example.com/foto.jpg')
  })

  it('el menú arranca cerrado y se abre al clickear el avatar', async () => {
    render(<UserMenu email="juanchilorenzo@gmail.com" avatarUrl={null} />)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /menú de usuario/i }))

    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByText('juanchilorenzo@gmail.com')).toBeInTheDocument()
  })

  it('incluye el selector de tema dentro del menú', async () => {
    render(<UserMenu email="juanchilorenzo@gmail.com" avatarUrl={null} />)
    await userEvent.click(screen.getByRole('button', { name: /menú de usuario/i }))
    expect(screen.getByRole('radiogroup', { name: /tema/i })).toBeInTheDocument()
  })

  it('cierra el menú con Escape', async () => {
    render(<UserMenu email="juanchilorenzo@gmail.com" avatarUrl={null} />)
    await userEvent.click(screen.getByRole('button', { name: /menú de usuario/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('cerrar sesión llama a signOut y refresca', async () => {
    render(<UserMenu email="juanchilorenzo@gmail.com" avatarUrl={null} />)
    await userEvent.click(screen.getByRole('button', { name: /menú de usuario/i }))

    await userEvent.click(screen.getByRole('menuitem', { name: /cerrar sesión/i }))

    expect(signOut).toHaveBeenCalled()
    expect(refresh).toHaveBeenCalled()
  })
})
