import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  cookieSet,
  cookieDelete,
  cookieGet,
  redirect,
  disconnect,
  revalidatePath,
  rpc,
} = vi.hoisted(() => ({
  cookieSet: vi.fn(),
  cookieDelete: vi.fn(),
  cookieGet: vi.fn(),
  redirect: vi.fn(),
  disconnect: vi.fn(),
  revalidatePath: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: async () => ({ set: cookieSet, delete: cookieDelete, get: cookieGet }),
}))
vi.mock('next/navigation', () => ({ redirect }))
vi.mock('next/cache', () => ({ revalidatePath }))
vi.mock('@/utils/mercadopago/account', () => ({ disconnect }))
vi.mock('@/utils/supabase/service', () => ({ createServiceClient: () => ({ rpc }) }))

import {
  signIn,
  signOut,
  disconnectMercadoPago,
  blockSeats,
  unblockSeats,
  cancelOrder,
} from '@/app/admin/actions'
import { ADMIN_COOKIE, createSessionToken, verifySessionToken } from '@/lib/admin/session'

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
    expect(await verifySessionToken(SECRET, 'session', valor, Date.now())).toBe(true)
    expect(redirect).toHaveBeenCalledWith('/admin')
  })
})

describe('signOut', () => {
  beforeEach(() => vi.clearAllMocks())

  it('borra la cookie con el mismo path con el que se seteó y manda al login', async () => {
    await signOut()
    expect(cookieDelete).toHaveBeenCalledWith({ name: ADMIN_COOKIE, path: '/admin' })
    expect(redirect).toHaveBeenCalledWith('/admin/login')
  })
})

describe('disconnectMercadoPago', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_SESSION_SECRET = SECRET
  })

  it('no desconecta nada si falta la cookie de sesión', async () => {
    cookieGet.mockReturnValue(undefined)
    await disconnectMercadoPago()
    expect(disconnect).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('no desconecta nada con una cookie inválida', async () => {
    cookieGet.mockReturnValue({ value: 'token-invalido' })
    await disconnectMercadoPago()
    expect(disconnect).not.toHaveBeenCalled()
  })

  it('no desconecta nada con un token de tipo state en la cookie de sesión', async () => {
    const stateToken = await createSessionToken(SECRET, 'oauth', Date.now() + 60_000)
    cookieGet.mockReturnValue({ value: stateToken })
    await disconnectMercadoPago()
    expect(disconnect).not.toHaveBeenCalled()
  })

  it('no desconecta nada sin ADMIN_SESSION_SECRET configurado', async () => {
    const sessionToken = await createSessionToken(SECRET, 'session', Date.now() + 60_000)
    cookieGet.mockReturnValue({ value: sessionToken })
    delete process.env.ADMIN_SESSION_SECRET

    await disconnectMercadoPago()
    expect(disconnect).not.toHaveBeenCalled()
  })

  it('desconecta con una cookie de sesión válida', async () => {
    const sessionToken = await createSessionToken(SECRET, 'session', Date.now() + 60_000)
    cookieGet.mockReturnValue({ value: sessionToken })

    await disconnectMercadoPago()
    expect(disconnect).toHaveBeenCalledTimes(1)
    expect(revalidatePath).toHaveBeenCalledWith('/admin')
  })
})

async function withSession(): Promise<void> {
  process.env.ADMIN_SESSION_SECRET = SECRET
  const token = await createSessionToken(SECRET, 'session', Date.now() + 60_000)
  cookieGet.mockReturnValue({ value: token })
}

function withoutSession(): void {
  process.env.ADMIN_SESSION_SECRET = SECRET
  cookieGet.mockReturnValue(undefined)
}

describe('blockSeats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sin sesión válida no toca la base', async () => {
    withoutSession()
    const result = await blockSeats(['platea-F01-01'])

    expect(rpc).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
    expect(result.ok).toBe(false)
  })

  it('con sesión llama a la función y revalida', async () => {
    await withSession()
    rpc.mockResolvedValue({ data: 2, error: null })

    const result = await blockSeats(['platea-F01-01', 'platea-F01-02'])

    expect(rpc).toHaveBeenCalledWith('admin_block_seats', {
      p_seat_ids: ['platea-F01-01', 'platea-F01-02'],
    })
    expect(revalidatePath).toHaveBeenCalledWith('/admin')
    expect(result).toMatchObject({ ok: true, count: 2 })
    expect(result.message).toMatch(/2/)
  })

  it('avisa cuando bloqueó menos de las pedidas', async () => {
    await withSession()
    rpc.mockResolvedValue({ data: 1, error: null })

    const result = await blockSeats(['platea-F01-01', 'platea-F01-02'])

    expect(result.ok).toBe(true)
    expect(result.message).toMatch(/1 de 2/)
  })

  it('con error de la base no revalida y avisa', async () => {
    await withSession()
    rpc.mockResolvedValue({ data: null, error: { message: 'roto' } })

    const result = await blockSeats(['platea-F01-01'])

    expect(result.ok).toBe(false)
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('con una selección vacía no llama a la base', async () => {
    await withSession()
    const result = await blockSeats([])

    expect(rpc).not.toHaveBeenCalled()
    expect(result.ok).toBe(false)
  })
})

describe('unblockSeats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sin sesión válida no toca la base', async () => {
    withoutSession()
    await unblockSeats(['platea-F01-01'])
    expect(rpc).not.toHaveBeenCalled()
  })

  it('con sesión llama a la función y revalida', async () => {
    await withSession()
    rpc.mockResolvedValue({ data: 3, error: null })

    const result = await unblockSeats(['platea-F01-01'])

    expect(rpc).toHaveBeenCalledWith('admin_unblock_seats', {
      p_seat_ids: ['platea-F01-01'],
    })
    expect(revalidatePath).toHaveBeenCalledWith('/admin')
    expect(result).toMatchObject({ ok: true, count: 3 })
  })
})

describe('cancelOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sin sesión válida no toca la base', async () => {
    withoutSession()
    await cancelOrder('11111111-1111-1111-1111-111111111111')
    expect(rpc).not.toHaveBeenCalled()
  })

  it('con sesión cancela y revalida', async () => {
    await withSession()
    rpc.mockResolvedValue({ data: 3, error: null })

    const result = await cancelOrder('11111111-1111-1111-1111-111111111111')

    expect(rpc).toHaveBeenCalledWith('admin_cancel_order', {
      p_order_id: '11111111-1111-1111-1111-111111111111',
    })
    expect(revalidatePath).toHaveBeenCalledWith('/admin')
    expect(result).toMatchObject({ ok: true, count: 3 })
  })

  it('una orden que ya no se puede cancelar devuelve cero butacas', async () => {
    await withSession()
    rpc.mockResolvedValue({ data: 0, error: null })

    const result = await cancelOrder('11111111-1111-1111-1111-111111111111')

    expect(result.ok).toBe(true)
    expect(result.count).toBe(0)
    expect(result.message).toMatch(/no/i)
  })
})
