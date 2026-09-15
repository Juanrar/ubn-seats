export function filterOrdersByEmail<T extends { email: string | null }>(
  orders: T[],
  query: string,
): T[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return orders
  return orders.filter((order) => order.email?.toLowerCase().includes(needle) ?? false)
}
