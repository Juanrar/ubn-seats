'use client'

import { useState } from 'react'
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '@/components/admin/buttons'
import { formatTotal } from '@/lib/format'
import type { AdminOrder } from '@/utils/admin/orders'

export const ORDER_STATUS_TEXT: Record<string, string> = {
  pending: 'pendiente de pago',
  confirmed: 'pagada',
  cancelled: 'cancelada',
  paid_without_seats: 'cobrada sin butacas',
}

export function seatCount(count: number): string {
  return count === 1 ? '1 butaca' : `${count} butacas`
}

export function seatNumber(seatId: string): string {
  return seatId.replace(/^[a-z-]+-/, '')
}

export interface OrderDetailProps {
  order: AdminOrder
  pending: boolean
  onCancelOrder: () => void
  onClose: () => void
}

export function OrderDetail({ order, pending, onCancelOrder, onClose }: OrderDetailProps) {
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null)
  const confirming = confirmingOrderId === order.id

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-hand-h2 font-bold">Orden</h3>
      <p className="text-hand-base font-medium break-all">{order.email ?? 'Sin mail'}</p>
      <p className="text-hand-sm text-ink-mute">
        {ORDER_STATUS_TEXT[order.status] ?? order.status} ·{' '}
        <span className="font-mono text-[13px]">{formatTotal(order.amount)}</span>
      </p>
      <p className="text-hand-sm text-ink-mute">
        {seatCount(order.seatIds.length)}: {order.seatIds.map(seatNumber).join(', ')}
      </p>

      {confirming ? (
        <div className="flex flex-col gap-3 border-t border-rule-soft pt-3">
          <p role="alert" className="text-hand-sm text-ink">
            Se liberan las butacas y la orden queda cancelada. No se puede deshacer.
          </p>
          {order.status === 'confirmed' && order.mpPaymentId ? (
            <p className="text-hand-sm text-ink-mute">
              La plata no se devuelve sola: hacelo a mano en Mercado Pago, pago{' '}
              <span className="font-mono text-[13px]">{order.mpPaymentId}</span>.
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setConfirmingOrderId(null)} className={SECONDARY_BUTTON}>
              Mejor no
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setConfirmingOrderId(null)
                onCancelOrder()
              }}
              className={PRIMARY_BUTTON}
            >
              Confirmar la cancelación
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className={SECONDARY_BUTTON}>
            Cerrar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmingOrderId(order.id)}
            className={PRIMARY_BUTTON}
          >
            Cancelar la orden
          </button>
        </div>
      )}
    </div>
  )
}
