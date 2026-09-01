import type { GeometryPlan } from '@/lib/types'

export interface Point {
  x: number
  y: number
}

export interface Placement extends Point {
  angle: number
}

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

export function rowRadius(geometry: GeometryPlan, row: number): number {
  return geometry.firstRowRadius + (row - 1) * geometry.rowPitch
}

export function offsetToTheta(
  geometry: GeometryPlan,
  offset: number,
  radius: number,
): number {
  return (offset * geometry.seatPitch) / radius
}

export function placeOnArc(
  geometry: GeometryPlan,
  radius: number,
  theta: number,
): Placement {
  return {
    x: geometry.center.x + radius * Math.sin(theta),
    y: geometry.center.y + radius * Math.cos(theta),
    angle: (-theta * 180) / Math.PI,
  }
}

export function placeAtOffset(
  geometry: GeometryPlan,
  row: number,
  offset: number,
): Placement {
  const radius = rowRadius(geometry, row)
  return placeOnArc(geometry, radius, offsetToTheta(geometry, offset, radius))
}

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
