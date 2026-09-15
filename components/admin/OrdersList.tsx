'use client'

import { useState, useTransition } from 'react'
import { cancelOrder } from '@/app/admin/actions'
import { ORDER_STATUS_TEXT, OrderDetail, seatCount } from '@/components/admin/OrderDetail'
import { filterOrdersByEmail } from '@/lib/admin/orderSearch'
import { formatTotal } from '@/lib/format'
import type { AdminOrder } from '@/utils/admin/orders'

export function OrdersList({ orders }: { orders: AdminOrder[] }) {
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const open = orders.find((order) => order.id === openId) ?? null
  const visible = filterOrdersByEmail(orders, query)

  const cancel = (orderId: string) => {
    startTransition(async () => {
      try {
        const result = await cancelOrder(orderId)
        setMessage(result.message)
        setOpenId(null)
      } catch {
        setMessage('Algo falló. Probá de nuevo.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="status"
        aria-live="polite"
        className="text-hand-sm text-ink-mute empty:absolute empty:h-px empty:w-px empty:overflow-hidden empty:whitespace-nowrap"
      >
        {message}
      </div>

      {open ? (
        <OrderDetail
          order={open}
          pending={pending}
          onCancelOrder={() => cancel(open.id)}
          onClose={() => setOpenId(null)}
        />
      ) : orders.length === 0 ? (
        <p className="text-hand-base text-ink-mute">Todavía no hay órdenes.</p>
      ) : (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-hand-sm text-ink-mute">Buscar por mail</span>
            <input
              type="search"
              inputMode="email"
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-11 rounded-md border border-rule bg-transparent px-3 text-hand-base"
            />
          </label>

          {visible.length === 0 ? (
            <p className="text-hand-base text-ink-mute">No hay órdenes con ese mail.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-rule-soft border-y border-rule">
              {visible.map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(order.id)}
                    className="flex min-h-11 w-full flex-col items-start gap-0.5 py-3 text-left"
                  >
                    <span className="text-hand-base font-medium break-all">{order.email ?? 'Sin mail'}</span>
                    <span className="text-hand-sm text-ink-mute">
                      {ORDER_STATUS_TEXT[order.status] ?? order.status} ·{' '}
                      <span className="font-mono text-[13px]">{formatTotal(order.amount)}</span> ·{' '}
                      {seatCount(order.seatIds.length)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
