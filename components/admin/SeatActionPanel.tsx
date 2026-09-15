'use client'

import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '@/components/admin/buttons'
import { OrderDetail, seatCount } from '@/components/admin/OrderDetail'
import type { SelectionAction } from '@/lib/admin/seatState'
import type { AdminOrder } from '@/utils/admin/orders'

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
  return (
    <section className="flex flex-col gap-3">
      <div role="status" aria-live="polite" className="text-hand-sm text-ink-mute empty:hidden">
        {message}
      </div>

      {order ? (
        <OrderDetail order={order} pending={pending} onCancelOrder={onCancelOrder} onClose={onCloseOrder} />
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
          <button type="button" onClick={onClear} className={SECONDARY_BUTTON}>
            Deshacer la selección
          </button>
        </div>
      ) : null}

      {!order && (action === 'block' || action === 'unblock') ? (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onClear} className={SECONDARY_BUTTON}>
            Deshacer la selección
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={action === 'block' ? onBlock : onUnblock}
            className={PRIMARY_BUTTON}
          >
            {action === 'block' ? 'Bloquear' : 'Liberar'} {seatCount(selectedCount)}
          </button>
        </div>
      ) : null}
    </section>
  )
}
