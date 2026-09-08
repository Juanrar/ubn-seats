import { describe, it, expect, vi, beforeEach } from 'vitest'

const { cookieSet, cookieDelete, redirect } = vi.hoisted(() => ({
  cookieSet: vi.fn(),
  cookieDelete: vi.fn(),
  redirect: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: async () => ({ set: cookieSet, delete: cookieDelete }),
}))
vi.mock('next/navigation', () => ({ redirect }))

import { signIn, signOut } from '@/app/admin/actions'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin/session'

const SECRET = 'secreto-de-prueba'

function form(password: string): FormData {
  const data = new FormData()
  data.set('password', password)
  return data
}

describe('signIn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_PASSWORD = 'la-contraseña'
    process.env.ADMIN_SESSION_SECRET = SECRET
  })

  it('rechaza una contraseña incorrecta sin setear cookie', async () => {
    const state = await signIn({ error: null }, form('otra-cosa'))
    expect(state.error).toMatch(/contraseña/i)
    expect(cookieSet).not.toHaveBeenCalled()
    expect(redirect).not.toHaveBeenCalled()
  })

  it('rechaza una contraseña vacía sin setear cookie', async () => {
    const state = await signIn({ error: null }, form(''))
    expect(state.error).toMatch(/contraseña/i)
    expect(cookieSet).not.toHaveBeenCalled()
  })

  it('con la contraseña correcta pero sin ADMIN_SESSION_SECRET devuelve error sin setear cookie', async () => {
    delete process.env.ADMIN_SESSION_SECRET

    const state = await signIn({ error: null }, form('la-contraseña'))
    expect(state.error).toMatch(/no está configurado/i)
    expect(cookieSet).not.toHaveBeenCalled()
    expect(redirect).not.toHaveBeenCalled()
  })

  it('con la contraseña correcta setea una cookie httpOnly válida y redirige', async () => {
    await signIn({ error: null }, form('la-contraseña'))

    expect(cookieSet).toHaveBeenCalledTimes(1)
    const [nombre, valor, opciones] = cookieSet.mock.calls[0]
    expect(nombre).toBe(ADMIN_COOKIE)
    expect(opciones.httpOnly).toBe(true)
    expect(opciones.sameSite).toBe('lax')
    expect(opciones.path).toBe('/admin')
    expect(verifySessionToken(SECRET, valor, Date.now())).toBe(true)
    expect(redirect).toHaveBeenCalledWith('/admin')
  })
})

describe('signOut', () => {
  beforeEach(() => vi.clearAllMocks())

  it('borra la cookie y manda al login', async () => {
    await signOut()
    expect(cookieDelete).toHaveBeenCalledWith(ADMIN_COOKIE)
    expect(redirect).toHaveBeenCalledWith('/admin/login')
  })
})
