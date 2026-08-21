import { describe, it, expect } from 'vitest'
import { priceFor, tierLabel } from '@/lib/pricing'

describe('priceFor', () => {
  it('cobra Platea A en las filas 1 a 5 del bloque central', () => {
    for (const row of [1, 3, 5]) expect(priceFor('platea', row)).toBe(45000)
  })

  it('cobra Platea B en las filas 6 a 10', () => {
    for (const row of [6, 8, 10]) expect(priceFor('platea', row)).toBe(38000)
  })

  it('cobra Platea C en las filas 11 a 15', () => {
    for (const row of [11, 13, 15]) expect(priceFor('platea', row)).toBe(30000)
  })

  it('cobra tarifa de ala sin importar la fila: el sector manda sobre la fila', () => {
    expect(priceFor('platea-ala-izq', 7)).toBe(24000)
    expect(priceFor('platea-ala-der', 7)).toBe(24000)
    expect(priceFor('platea-ala-izq', 16)).toBe(24000)
  })

  it('cobra tarifa accesible en los espacios accesibles', () => {
    expect(priceFor('platea-accesible', 1)).toBe(24000)
    expect(priceFor('platea-accesible', 14)).toBe(24000)
  })
})

describe('tierLabel', () => {
  it('nombra las franjas del bloque central', () => {
    expect(tierLabel('platea', 2)).toBe('Platea A')
    expect(tierLabel('platea', 7)).toBe('Platea B')
    expect(tierLabel('platea', 12)).toBe('Platea C')
  })

  it('nombra alas y accesibles', () => {
    expect(tierLabel('platea-ala-der', 9)).toBe('Ala lateral')
    expect(tierLabel('platea-accesible', 4)).toBe('Espacio accesible')
  })
})
