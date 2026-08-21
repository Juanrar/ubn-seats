import { WING_START_LEFT, WING_START_RIGHT } from '@/lib/constants'

/**
 * Numeración del bloque central de una fila, de izquierda a derecha.
 *
 * El plano numera desde el centro hacia afuera: impares hacia la izquierda,
 * pares hacia la derecha. Una fila de 14 queda
 * `13 11 9 7 5 3 1 | 2 4 6 8 10 12 14`.
 */
export function centerRowNumbers(n: number): number[] {
  if (n < 0) throw new Error(`Cantidad de butacas negativa: ${n}`)
  if (n % 2 !== 0) throw new Error(`La fila debe tener cantidad par de butacas, recibí ${n}`)

  const half = n / 2
  const left: number[] = []
  for (let i = half; i >= 1; i--) left.push(2 * i - 1)
  const right: number[] = []
  for (let i = 1; i <= half; i++) right.push(2 * i)
  return [...left, ...right]
}

/**
 * Número de la butaca `index` de un ala, contando hacia afuera desde el
 * pasillo. Las alas continúan la serie del bloque central: 17, 19, 21 a la
 * izquierda y 18, 20, 22 a la derecha.
 */
export function wingNumber(side: 'left' | 'right', index: number): number {
  const start = side === 'left' ? WING_START_LEFT : WING_START_RIGHT
  return start + 2 * index
}
