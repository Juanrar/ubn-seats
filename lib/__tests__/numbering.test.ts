import { describe, it, expect } from 'vitest'
import { centerRowNumbers, wingNumber } from '@/lib/numbering'

describe('centerRowNumbers', () => {
  it('numera una fila de 14 como en el plano', () => {
    expect(centerRowNumbers(14)).toEqual([
      13, 11, 9, 7, 5, 3, 1, 2, 4, 6, 8, 10, 12, 14,
    ])
  })

  it('numera una fila de 16 como en el plano', () => {
    expect(centerRowNumbers(16)).toEqual([
      15, 13, 11, 9, 7, 5, 3, 1, 2, 4, 6, 8, 10, 12, 14, 16,
    ])
  })

  it('pone el 1 y el 2 en el centro de la fila', () => {
    for (const n of [14, 16]) {
      const nums = centerRowNumbers(n)
      expect(nums[n / 2 - 1]).toBe(1)
      expect(nums[n / 2]).toBe(2)
    }
  })

  it('deja los impares a la izquierda y los pares a la derecha', () => {
    const nums = centerRowNumbers(16)
    expect(nums.slice(0, 8).every((x) => x % 2 === 1)).toBe(true)
    expect(nums.slice(8).every((x) => x % 2 === 0)).toBe(true)
  })

  it('no repite números y usa exactamente 1..n', () => {
    const nums = centerRowNumbers(16)
    expect([...nums].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 16 }, (_, i) => i + 1),
    )
  })

  it('devuelve vacío para 0', () => {
    expect(centerRowNumbers(0)).toEqual([])
  })

  it('rechaza cantidades impares', () => {
    expect(() => centerRowNumbers(15)).toThrow(/par/i)
  })

  it('rechaza cantidades negativas', () => {
    expect(() => centerRowNumbers(-2)).toThrow()
  })
})

describe('wingNumber', () => {
  it('el ala izquierda continúa la serie impar desde 17 hacia afuera', () => {
    expect([0, 1, 2].map((i) => wingNumber('left', i))).toEqual([17, 19, 21])
  })

  it('el ala derecha continúa la serie par desde 18 hacia afuera', () => {
    expect([0, 1, 2].map((i) => wingNumber('right', i))).toEqual([18, 20, 22])
  })
})
