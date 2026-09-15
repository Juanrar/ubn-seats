import { OrdersList } from '@/components/admin/OrdersList'
import { fetchAdminOrders, type AdminOrder } from '@/utils/admin/orders'
import { createServiceClient } from '@/utils/supabase/service'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  let orders: AdminOrder[] | null = null
  try {
    orders = await fetchAdminOrders(createServiceClient())
  } catch {
    orders = null
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-6">
      <h1 className="text-hand-h1 font-bold">Órdenes</h1>
      {orders ? (
        <OrdersList orders={orders} />
      ) : (
        <p role="alert" className="text-hand-base text-ink-mute">
          No se pudieron cargar las órdenes. Recargá la página.
        </p>
      )}
    </main>
  )
}
