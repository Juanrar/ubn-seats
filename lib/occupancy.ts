import { OCCUPANCY_RATE, OCCUPANCY_SEED } from '@/lib/constants'
import type { Seat } from '@/lib/types'

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildOccupancy(
  seats: Seat[],
  seed: number = OCCUPANCY_SEED,
  rate: number = OCCUPANCY_RATE,
): Set<string> {
  const rnd = mulberry32(seed)
  const occupied = new Set<string>()
  const ordered = [...seats].sort((a, b) => a.id.localeCompare(b.id))

  for (const seat of ordered) {
    const roll = rnd()
    if (seat.kind === 'accessible') continue
    if (roll < rate) occupied.add(seat.id)
  }

  return occupied
}
