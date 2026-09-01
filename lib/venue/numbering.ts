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

export function wingNumber(startNumber: number, index: number): number {
  return startNumber + 2 * index
}
