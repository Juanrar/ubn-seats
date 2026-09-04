import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'
import { MAX_SEATS } from '@/lib/constants'

const { getUser, insert, revalidatePath } = vi.hoisted(() => ({
  getUser: vi.fn(),
  insert: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('@/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({ insert }),
  }),
}))
vi.mock('next/cache', () => ({ revalidatePath }))

import { reserveSeats } from '@/app/actions'

const seatIds = buildVenue(TEATRO_DEL_GLOBO).seats.map((seat) => seat.id)

beforeEach(() => {
  getUser.mockReset()
  insert.mockReset()
  revalidatePath.mockReset()
})

describe('reserveSeats', () => {
  it('rechaza sin sesión', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    const result = await reserveSeats(['platea-F07-12'])
    expect(result).toEqual({ ok: false, message: 'Iniciá sesión para reservar.' })
    expect(insert).not.toHaveBeenCalled()
  })

  it('inserta una fila por butaca con el user_id de la sesión', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    insert.mockResolvedValue({ error: null })

    const result = await reserveSeats(['platea-F07-12', 'platea-F07-13'])

    expect(insert).toHaveBeenCalledWith([
      { seat_id: 'platea-F07-12', user_id: 'user-1' },
      { seat_id: 'platea-F07-13', user_id: 'user-1' },
    ])
    expect(result).toEqual({ ok: true })
    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('devuelve mensaje de conflicto si la butaca ya estaba tomada (23505)', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    insert.mockResolvedValue({ error: { code: '23505' } })

    const result = await reserveSeats(['platea-F07-12'])

    expect(result).toEqual({
      ok: false,
      message: 'Alguien reservó una de estas butacas justo antes que vos. Elegí otra.',
    })
    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('devuelve mensaje genérico ante otros errores', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    insert.mockResolvedValue({ error: { code: '99999' } })

    const result = await reserveSeats(['platea-F07-12'])

    expect(result).toEqual({ ok: false, message: 'No se pudo confirmar la reserva. Probá de nuevo.' })
  })

  it('rechaza un array vacío sin llamar a insert', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const result = await reserveSeats([])

    expect(result).toEqual({ ok: false, message: 'Selección inválida.' })
    expect(insert).not.toHaveBeenCalled()
  })

  it('rechaza más butacas que MAX_SEATS sin llamar a insert', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const result = await reserveSeats(seatIds.slice(0, MAX_SEATS + 1))

    expect(result).toEqual({ ok: false, message: 'Selección inválida.' })
    expect(insert).not.toHaveBeenCalled()
  })

  it('rechaza una butaca que no existe en el catálogo sin llamar a insert', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const result = await reserveSeats(['not-a-real-seat'])

    expect(result).toEqual({ ok: false, message: 'Selección inválida.' })
    expect(insert).not.toHaveBeenCalled()
  })
})
