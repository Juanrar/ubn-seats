const formatter = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })

/** Precio sin símbolo: "45.000". */
export function formatPrice(n: number): string {
  return formatter.format(n)
}

/** Total con símbolo: "$ 45.000". */
export function formatTotal(n: number): string {
  return `$ ${formatter.format(n)}`
}
