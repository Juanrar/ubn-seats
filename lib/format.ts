const formatter = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })

export function formatPrice(n: number): string {
  return formatter.format(n)
}

export function formatTotal(n: number): string {
  return `$ ${formatter.format(n)}`
}
