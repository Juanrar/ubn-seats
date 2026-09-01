import type { SeatKind } from '@/lib/types'

export function seatLabel(
  kind: SeatKind,
  row: number,
  number: number,
  tier: string,
): string {
  if (kind === 'accessible') {
    return `Fila ${row}, espacio accesible ${number}, ${tier}`
  }
  return `Fila ${row}, butaca ${number}, ${tier}`
}
