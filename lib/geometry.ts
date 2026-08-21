import { CENTER, R0, ROW_PITCH, SEAT_PITCH } from '@/lib/constants'

export interface Point {
  x: number
  y: number
}

export interface Placement extends Point {
  /** GRADOS, listo para el transform del SVG. */
  angle: number
}

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** Radio del arco de una fila 1-indexada. */
export function rowRadius(row: number): number {
  return R0 + (row - 1) * ROW_PITCH
}

/**
 * Convierte un offset (en unidades de SEAT_PITCH desde el centro de la fila) al
 * ángulo en radianes. Dividir por el radio es lo que mantiene el tamaño de
 * butaca constante entre filas.
 */
export function offsetToTheta(offset: number, radius: number): number {
  return (offset * SEAT_PITCH) / radius
}

/**
 * Punto del arco de radio `radius` en el ángulo `theta` (radianes), con la
 * rotación necesaria para que la butaca encare al centro de curvatura.
 *
 * En SVG el eje y crece hacia abajo, así que el centro de curvatura queda por
 * encima de las filas y `cos(theta)` desplaza hacia abajo.
 */
export function placeOnArc(radius: number, theta: number): Placement {
  return {
    x: CENTER.x + radius * Math.sin(theta),
    y: CENTER.y + radius * Math.cos(theta),
    angle: (-theta * 180) / Math.PI,
  }
}

/** Atajo: ubica un offset dentro de una fila 1-indexada. */
export function placeAtOffset(row: number, offset: number): Placement {
  const radius = rowRadius(row)
  return placeOnArc(radius, offsetToTheta(offset, radius))
}

/** Caja que encierra todos los puntos, más un padding uniforme. */
export function boundingBox(points: Point[], pad: number): Box {
  if (points.length === 0) {
    throw new Error('boundingBox necesita al menos un punto')
  }
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs) - pad
  const minY = Math.min(...ys) - pad
  const maxX = Math.max(...xs) + pad
  const maxY = Math.max(...ys) + pad
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}
