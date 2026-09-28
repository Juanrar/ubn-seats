'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createOrder } from '@/app/actions'

export type ReservationStatus = 'idle' | 'pending' | 'error'

export interface Reservation {
  status: ReservationStatus
  errorMessage: string | null
  confirm: (performanceId: string, seatIds: string[]) => void
}

export function useReservation(): Reservation {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const confirm = useCallback(
    (performanceId: string, seatIds: string[]) => {
      setErrorMessage(null)
      startTransition(async () => {
        const result = await createOrder(performanceId, seatIds)
        if (result.ok) {
          window.location.href = result.redirectUrl
          return
        }
        setErrorMessage(result.message)
        router.refresh()
      })
    },
    [router],
  )

  return {
    status: isPending ? 'pending' : errorMessage ? 'error' : 'idle',
    errorMessage,
    confirm,
  }
}
