'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { blockSeats, cancelOrder, loadOrder, unblockSeats } from '@/app/admin/actions'
import { AdminSeatButton } from '@/components/admin/AdminSeatButton'
import { SeatActionPanel } from '@/components/admin/SeatActionPanel'
import { SeatMap } from '@/components/SeatMap'
import { useAdminMap } from '@/hooks/useAdminMap'
import type { SeatOccupancy } from '@/lib/admin/seatState'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'
import { buildVenue } from '@/lib/venue'
import type { AdminOrder } from '@/utils/admin/orders'

export interface AdminSeatMapProps {
  occupancy: Map<string, SeatOccupancy>
}

export function AdminSeatMap({ occupancy }: AdminSeatMapProps) {
  const venue = useMemo(() => buildVenue(TEATRO_DEL_GLOBO), [])
  const map = useAdminMap(venue, occupancy)
  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setOrder(null)
    if (!map.openOrderId) return
    let cancelled = false
    loadOrder(map.openOrderId)
      .then((loaded) => {
        if (cancelled) return
        if (loaded === null) {
          setMessage('No se pudo cargar la orden. Probá de nuevo.')
          map.closeOrder()
          return
        }
        setOrder(loaded)
      })
      .catch(() => {
        if (cancelled) return
        setMessage('No se pudo cargar la orden. Probá de nuevo.')
        map.closeOrder()
      })
    return () => {
      cancelled = true
    }
  }, [map.openOrderId])

  const run = (action: () => Promise<{ message: string }>) => {
    startTransition(async () => {
      try {
        const result = await action()
        setMessage(result.message)
        map.clear()
        map.closeOrder()
      } catch {
        setMessage('Algo falló. Probá de nuevo.')
      }
    })
  }

  return (
    <section className="flex flex-col gap-5 border-t border-rule pt-4">
      <h2 className="text-hand-h2 font-bold">Butacas</h2>

      <div className="-mx-6 overflow-x-auto px-6">
        <div className="min-w-[560px]">
          <SeatMap
            venue={venue}
            onKeyDown={map.onKeyDown}
            renderSeat={(seat, geometry) => (
              <AdminSeatButton
                seat={seat}
                geometry={geometry}
                status={map.statusOf(seat)}
                focused={seat.id === map.focusedId}
                onActivate={map.activate}
                onFocus={map.onSeatFocus}
              />
            )}
          />
        </div>
      </div>

      <SeatActionPanel
        action={map.action}
        selectedCount={map.selectedCount}
        order={order}
        message={message}
        pending={pending}
        onBlock={() => run(() => blockSeats([...map.selectedIds]))}
        onUnblock={() => run(() => unblockSeats([...map.selectedIds]))}
        onClear={map.clear}
        onCancelOrder={() => run(() => cancelOrder(order!.id))}
        onCloseOrder={map.closeOrder}
      />
    </section>
  )
}
