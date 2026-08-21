import type { SectorId } from '@/lib/types'

const WING_PRICE = 24000
const ACCESSIBLE_PRICE = 24000

/**
 * Precio de una plaza. El sector manda sobre la fila: una butaca del ala en la
 * fila 7 cuesta tarifa de ala, no Platea B.
 */
export function priceFor(sector: SectorId, row: number): number {
  if (sector === 'platea-accesible') return ACCESSIBLE_PRICE
  if (sector === 'platea-ala-izq' || sector === 'platea-ala-der') return WING_PRICE
  if (row <= 5) return 45000
  if (row <= 10) return 38000
  return 30000
}

/** Nombre de la franja, para mostrar en el panel y en el aria-label. */
export function tierLabel(sector: SectorId, row: number): string {
  if (sector === 'platea-accesible') return 'Espacio accesible'
  if (sector === 'platea-ala-izq' || sector === 'platea-ala-der') return 'Ala lateral'
  if (row <= 5) return 'Platea A'
  if (row <= 10) return 'Platea B'
  return 'Platea C'
}
