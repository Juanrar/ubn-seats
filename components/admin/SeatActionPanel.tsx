'use client'

import { useState } from 'react'
import type { SelectionAction } from '@/lib/admin/seatState'
import { formatTotal } from '@/lib/format'
import type { AdminOrder } from '@/utils/admin/orders'

const ORDER_STATUS_TEXT: Record<string, string> = {
  pending: 'pendiente de pago',
  confirmed: 'pagada',
  cancelled: 'cancelada',
  paid_without_seats: 'cobrada sin butacas',
}

function seatCount(count: number): string {
  return count === 1 ? '1 butaca' : `${count} butacas`
}

function seatNumber(seatId: string): string {
  return seatId.replace(/^[a-z-]+-/, '')
}

export interface SeatActionPanelProps {
  action: SelectionAction
  selectedCount: number
  order: AdminOrder | null
  message: string | null
  pending: boolean
  onBlock: () => void
  onUnblock: () => void
  onClear: () => void
  onCancelOrder: () => void
  onCloseOrder: () => void
}

export function SeatActionPanel({
  action,
  selectedCount,
  order,
  message,
  pending,
  onBlock,
  onUnblock,
  onClear,
  onCancelOrder,
  onCloseOrder,
}: SeatActionPanelProps) {
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null)
  const confirming = order !== null && confirmingOrderId === order.id

  return (
    <section className="flex flex-col gap-4 border-t border-rule pt-4">
      <div role="status" aria-live="polite" className="text-hand-sm text-ink-mute">
        {message}
      </div>

      {order ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-hand-h2 font-bold">Orden</h3>
          <p className="text-hand-base font-medium">{order.email ?? 'Sin mail'}</p>
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
              <div className="flex gap-4">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setConfirmingOrderId(null)
                    onCancelOrder()
                  }}
                  className="text-hand-base font-medium text-ink underline"
                >
                  Confirmar la cancelación
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingOrderId(null)}
                  className="text-hand-base font-medium text-ink-mute underline"
                >
                  Mejor no
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-4">
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmingOrderId(order.id)}
                className="text-hand-base font-medium text-ink underline"
              >
                Cancelar la orden
              </button>
              <button
                type="button"
                onClick={onCloseOrder}
                className="text-hand-base font-medium text-ink-mute underline"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      ) : null}

      {!order && action === 'none' ? (
        <p className="text-hand-base text-ink-mute">
          Elegí butacas libres para bloquearlas, o tocá una vendida para ver su orden.
        </p>
      ) : null}

      {!order && action === 'mixed' ? (
        <div className="flex flex-col gap-3">
          <p role="alert" className="text-hand-base text-ink">
            Esta selección no se puede usar: mezcla libres con bloqueadas o tiene butacas
            que ya no están disponibles. Deshacé la selección y elegí de nuevo.
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClear}
              className="text-hand-base font-medium text-ink-mute underline"
            >
              Deshacer la selección
            </button>
          </div>
        </div>
      ) : null}

      {!order && (action === 'block' || action === 'unblock') ? (
        <div className="flex gap-4">
          <button
            type="button"
            disabled={pending}
            onClick={action === 'block' ? onBlock : onUnblock}
            className="text-hand-base font-medium text-ink underline"
          >
            {action === 'block' ? 'Bloquear' : 'Liberar'} {seatCount(selectedCount)}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="text-hand-base font-medium text-ink-mute underline"
          >
            Deshacer la selección
          </button>
        </div>
      ) : null}
    </section>
  )
}
