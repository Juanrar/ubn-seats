import type { RowPlan } from '@/lib/types'

/**
 * Configuración del sector Platea del Teatro del Globo, leída del plano.
 *
 * Corregir un conteo del plano es tocar únicamente este archivo: la geometría,
 * la numeración y el encuadre se recalculan solos.
 *
 * Notas del plano:
 * - Las filas 1 y 15 son más cortas (14 butacas) que el resto (16).
 * - La fila 16 existe SOLO en las alas: no tiene bloque central.
 * - Los espacios accesibles son plazas adicionales en el pasillo; no
 *   reemplazan butacas, por eso no alteran `center`.
 */
export const VENUE_ROWS: RowPlan[] = [
  { row: 1, center: 14, wing: 0, accessible: true },
  { row: 2, center: 16, wing: 0, accessible: false },
  { row: 3, center: 16, wing: 0, accessible: false },
  { row: 4, center: 16, wing: 0, accessible: true },
  { row: 5, center: 16, wing: 0, accessible: false },
  { row: 6, center: 16, wing: 3, accessible: false },
  { row: 7, center: 16, wing: 3, accessible: false },
  { row: 8, center: 16, wing: 3, accessible: false },
  { row: 9, center: 16, wing: 3, accessible: false },
  { row: 10, center: 16, wing: 3, accessible: false },
  { row: 11, center: 16, wing: 3, accessible: false },
  { row: 12, center: 16, wing: 3, accessible: false },
  { row: 13, center: 16, wing: 3, accessible: false },
  { row: 14, center: 16, wing: 3, accessible: true },
  { row: 15, center: 14, wing: 3, accessible: false },
  { row: 16, center: 0, wing: 3, accessible: false },
]
