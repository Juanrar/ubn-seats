export type SectorId =
  | 'platea'
  | 'platea-ala-izq'
  | 'platea-ala-der'
  | 'platea-accesible'

export type SeatKind = 'standard' | 'accessible'

export type SeatStatus = 'available' | 'occupied' | 'selected'

export interface Seat {
  /** Estable y derivable de (sector, fila, número). Ej: "platea-F07-12". */
  id: string
  sector: SectorId
  /** 1-indexada, igual que el plano. */
  row: number
  /** Numeración del plano: impares a la izquierda, pares a la derecha. */
  number: number
  kind: SeatKind
  price: number
  x: number
  y: number
  /** GRADOS, para el transform del SVG. */
  angle: number
}

export interface RowConfig {
  /** 1-indexada. */
  row: number
  /** Butacas del bloque central. 0 si la fila no tiene bloque central. */
  center: number
  /** Butacas por ala (por lado). 0 si la fila no tiene alas. */
  wing: number
  /** Si es true, la fila lleva 2 espacios accesibles, uno por lado. */
  accessible: boolean
}
