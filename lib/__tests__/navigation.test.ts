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

describe('nextSeatId — saltea butacas ocupadas', () => {
  const venue = buildVenue(TEATRO_DEL_GLOBO)
  const rowSeven = venue.rows.find((r) => r.row === 7)!.seats

  it('sin conjunto de salteo se comporta igual que antes', () => {
    const from = rowSeven[0].id
    expect(nextSeatId(venue.seats, from, 'right')).toBe(rowSeven[1].id)
  })

  it('salta por encima de una ocupada contigua', () => {
    const skip = new Set([rowSeven[1].id])
    expect(nextSeatId(venue.seats, rowSeven[0].id, 'right', skip)).toBe(rowSeven[2].id)
  })

  it('salta por encima de varias ocupadas seguidas', () => {
    const skip = new Set([rowSeven[1].id, rowSeven[2].id, rowSeven[3].id])
    expect(nextSeatId(venue.seats, rowSeven[0].id, 'right', skip)).toBe(rowSeven[4].id)
  })

  it('se queda donde está si no queda ninguna libre en esa dirección', () => {
    const skip = new Set(rowSeven.slice(1).map((s) => s.id))
    expect(nextSeatId(venue.seats, rowSeven[0].id, 'right', skip)).toBe(rowSeven[0].id)
  })

  it('al cambiar de fila elige la más cercana que no esté ocupada', () => {
    const rowEight = venue.rows.find((r) => r.row === 8)!.seats
    const current = rowSeven[5]
    const natural = nextSeatId(venue.seats, current.id, 'down')
    const skip = new Set([natural])
    const chosen = nextSeatId(venue.seats, current.id, 'down', skip)
    expect(chosen).not.toBe(natural)
    expect(rowEight.some((s) => s.id === chosen)).toBe(true)
  })
})
