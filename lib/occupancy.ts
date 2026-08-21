import { OCCUPANCY_RATE, OCCUPANCY_SEED } from '@/lib/constants'
import type { Seat } from '@/lib/types'

/**
 * PRNG de 32 bits con semilla. Reemplaza a Math.random, que daría un mapa
 * distinto en el servidor y en el cliente y rompería la hidratación de Next.js.
 */
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

/**
 * Conjunto de butacas ocupadas. Ordena por id antes de sortear para que el
 * resultado no dependa del orden en que llegan las butacas.
 *
 * Los espacios accesibles nunca se ocupan: son solo 6 y verlos ocupados al azar
 * arruinaría la demostración de ese estado. Igual consumen un número del PRNG,
 * para que el patrón del resto no dependa de esta decisión.
 */
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
