import { describe, it, expect, vi, beforeEach } from 'vitest'

const { from, refreshTokens } = vi.hoisted(() => ({
  from: vi.fn(),
  refreshTokens: vi.fn(),
}))

vi.mock('@/utils/supabase/service', () => ({ createServiceClient: () => ({ from }) }))
vi.mock('@/utils/mercadopago/oauth', () => ({ refreshTokens }))

import {
  getConnectedAccount,
  requireAccessToken,
  disconnect,
  NoConnectedAccountError,
} from '@/utils/mercadopago/account'

const FAR = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
const NEAR = new Date(Date.now() + 60 * 1000).toISOString()

function row(expiresAt: string) {
  return {
    mp_user_id: '123456789',
    access_token: 'APP_USR-token',
    refresh_token: 'TG-refresh',
    public_key: 'APP_USR-public',
    expires_at: expiresAt,
    connected_at: '2026-09-08T15:00:00.000Z',
  }
}

function mockSelect(data: unknown) {
  const maybeSingle = vi.fn(async () => ({ data, error: null }))
  from.mockReturnValue({ select: () => ({ maybeSingle }), upsert: vi.fn(async () => ({ error: null })) })
}

function mockSelectAndUpsert(data: unknown) {
  const upsert = vi.fn(async (_payload: Record<string, unknown>) => ({ error: null }))
  const maybeSingle = vi.fn(async () => ({ data, error: null }))
  from.mockReturnValue({ select: () => ({ maybeSingle }), upsert })
  return upsert
}

function mockDelete() {
  const eq = vi.fn(async () => ({ error: null }))
  from.mockReturnValue({ delete: () => ({ eq }) })
  return eq
}

beforeEach(() => vi.clearAllMocks())

describe('getConnectedAccount', () => {
  it('devuelve null cuando no hay cuenta vinculada', async () => {
    mockSelect(null)
    expect(await getConnectedAccount()).toBeNull()
  })

  it('mapea la fila a ConnectedAccount', async () => {
    mockSelect(row(FAR))
    expect(await getConnectedAccount()).toMatchObject({
      mpUserId: '123456789',
      accessToken: 'APP_USR-token',
      refreshToken: 'TG-refresh',
      publicKey: 'APP_USR-public',
      expiresAt: Date.parse(FAR),
      connectedAt: '2026-09-08T15:00:00.000Z',
    })
  })
})

describe('requireAccessToken', () => {
  it('lanza NoConnectedAccountError si no hay cuenta vinculada', async () => {
    mockSelect(null)
    await expect(requireAccessToken()).rejects.toBeInstanceOf(NoConnectedAccountError)
  })

  it('devuelve el token guardado y no refresca si falta mucho para el vencimiento', async () => {
    mockSelect(row(FAR))
    expect(await requireAccessToken()).toBe('APP_USR-token')
    expect(refreshTokens).not.toHaveBeenCalled()
  })

  it('refresca, guarda y devuelve el token nuevo si el vencimiento está cerca', async () => {
    const upsert = mockSelectAndUpsert(row(NEAR))
    refreshTokens.mockResolvedValue({
      mpUserId: '123456789',
      accessToken: 'APP_USR-nuevo',
      refreshToken: 'TG-nuevo',
      publicKey: 'APP_USR-public',
      expiresAt: Date.now() + 15_552_000_000,
    })

    expect(await requireAccessToken()).toBe('APP_USR-nuevo')
    expect(refreshTokens).toHaveBeenCalledWith('TG-refresh')
    expect(upsert).toHaveBeenCalledTimes(1)
    expect(upsert.mock.calls[0][0]).toMatchObject({
      id: true,
      access_token: 'APP_USR-nuevo',
      refresh_token: 'TG-nuevo',
    })
  })
})

describe('disconnect', () => {
  it('borra la fila de la cuenta vinculada', async () => {
    const eq = mockDelete()
    await disconnect()
    expect(eq).toHaveBeenCalledWith('id', true)
  })
})
