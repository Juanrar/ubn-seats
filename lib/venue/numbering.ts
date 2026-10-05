function everyOtherUpTo(n: number, first: number): number[] {
  const numbers: number[] = []
  for (let number = first; number <= n; number += 2) numbers.push(number)
  return numbers
}

export function centerRowNumbers(n: number): number[] {
  if (n < 0) throw new Error(`Cantidad de butacas negativa: ${n}`)

  const left = everyOtherUpTo(n, 1).reverse()
  const right = everyOtherUpTo(n, 2)
  return [...left, ...right]
}
