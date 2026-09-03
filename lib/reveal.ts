import { REVEAL_MAX_DELAY_MS } from '@/lib/constants'
import type { Seat, StagePlan } from '@/lib/types'

export function buildRevealDelays(
  seats: Seat[],
  stage: StagePlan,
  maxDelayMs: number = REVEAL_MAX_DELAY_MS,
): Map<string, number> {
  const originX = stage.x + stage.width / 2
  const originY = stage.y + stage.height
  const distances = seats.map((seat) => Math.hypot(seat.x - originX, seat.y - originY))
  const maxDistance = Math.max(0, ...distances)

  return new Map(
    seats.map((seat, i) => [
      seat.id,
      maxDistance === 0 ? 0 : Math.round((distances[i] / maxDistance) * maxDelayMs),
    ]),
  )
}
