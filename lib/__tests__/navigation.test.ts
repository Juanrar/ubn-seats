import { describe, it, expect } from 'vitest'
import { nextSeatId } from '@/lib/navigation'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'

const seats = buildVenue(TEATRO_DEL_GLOBO).seats
const byId = (id: string) => seats.find((s) => s.id === id)!
const fila = (row: number) => seats.filter((s) => s.row === row).sort((a, b) => a.x - b.x)

describe('nextSeatId', () => {
  it('se mueve a la butaca de la derecha dentro de la fila', () => {
    const f7 = fila(7)
    expect(nextSeatId(seats, f7[3].id, 'right')).toBe(f7[4].id)
  })

  it('se mueve a la butaca de la izquierda dentro de la fila', () => {
    const f7 = fila(7)
    expect(nextSeatId(seats, f7[3].id, 'left')).toBe(f7[2].id)
  })

  it('se queda quieto en el extremo izquierdo de la fila', () => {
    const f7 = fila(7)
    expect(nextSeatId(seats, f7[0].id, 'left')).toBe(f7[0].id)
  })

  it('se queda quieto en el extremo derecho de la fila', () => {
    const f7 = fila(7)
    const ultima = f7[f7.length - 1]
    expect(nextSeatId(seats, ultima.id, 'right')).toBe(ultima.id)
  })

  it('baja a la fila siguiente eligiendo la butaca más cercana en x', () => {
    const origen = fila(7)[5]
    const destino = byId(nextSeatId(seats, origen.id, 'down'))
    expect(destino.row).toBe(8)
    const mejor = fila(8).reduce((a, b) =>
      Math.abs(b.x - origen.x) < Math.abs(a.x - origen.x) ? b : a,
    )
    expect(destino.id).toBe(mejor.id)
  })

  it('sube a la fila anterior eligiendo la butaca más cercana en x', () => {
    const origen = fila(7)[5]
    const destino = byId(nextSeatId(seats, origen.id, 'up'))
    expect(destino.row).toBe(6)
  })

  it('se queda quieto arriba de la fila 1', () => {
    const primera = fila(1)[3]
    expect(nextSeatId(seats, primera.id, 'up')).toBe(primera.id)
  })

  it('se queda quieto abajo de la fila 16', () => {
    const ultima = fila(16)[1]
    expect(nextSeatId(seats, ultima.id, 'down')).toBe(ultima.id)
  })

  it('salta de la fila 15 a la 16 aunque la 16 no tenga bloque central', () => {
    const origen = fila(15).find((s) => s.sector === 'platea-ala-der')!
    const destino = byId(nextSeatId(seats, origen.id, 'down'))
    expect(destino.row).toBe(16)
  })

  it('devuelve el mismo id si el actual no existe', () => {
    expect(nextSeatId(seats, 'no-existe', 'left')).toBe('no-existe')
  })
})
