'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { reserveSeats } from '@/app/actions'

export type ReservationStatus = 'idle' | 'pending' | 'error'

export interface Reservation {
  status: ReservationStatus
  errorMessage: string | null
  confirm: (seatIds: string[]) => void
}

export function useReservation(onSettled: () => void): Reservation {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const confirm = useCallback(
    (seatIds: string[]) => {
      setErrorMessage(null)
      startTransition(async () => {
        const result = await reserveSeats(seatIds)
        if (!result.ok) setErrorMessage(result.message)
        router.refresh()
        onSettled()
      })
    },
    [router, onSettled],
  )

  return {
    status: isPending ? 'pending' : errorMessage ? 'error' : 'idle',
    errorMessage,
    confirm,
  }
}
