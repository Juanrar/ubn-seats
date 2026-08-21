/** Ancho de una butaca, en unidades de usuario SVG. */
export const SEAT_WIDTH = 20
/** Alto de una butaca, en unidades de usuario SVG. */
export const SEAT_HEIGHT = 17
/** Separación entre centros de butacas contiguas, medida sobre el arco. */
export const SEAT_PITCH = 24
/** Separación entre radios de filas contiguas. */
export const ROW_PITCH = 26
/** Radio de la fila 1. */
export const R0 = 360
/** Centro de curvatura de los arcos, situado sobre el escenario. */
export const CENTER = { x: 0, y: 0 } as const
/** Ancho del pasillo entre bloque central y ala, en unidades de SEAT_PITCH. */
export const AISLE_GAP = 2.5
/**
 * Offset de la butaca interna del ala, en unidades de SEAT_PITCH.
 *
 * Es una constante y NO se deriva de la semianchura de cada fila: las filas 15
 * (14 butacas) y 16 (ninguna) tienen bloque central más angosto, y derivarlo
 * de ahí les correría el ala hacia adentro y torcería la columna. Vale
 * `7.5 + 1 + AISLE_GAP`, que es la posición que le corresponde a una fila de 16.
 */
export const WING_INNER_OFFSET = 11
/** Primera butaca del ala izquierda: continúa la serie impar. */
export const WING_START_LEFT = 17
/** Primera butaca del ala derecha: continúa la serie par. */
export const WING_START_RIGHT = 18

/** Tope de butacas por compra. */
export const MAX_SEATS = 8
/** Semilla del PRNG de ocupación. Fija a propósito: ver lib/occupancy.ts. */
export const OCCUPANCY_SEED = 20260820
/** Proporción de butacas ocupadas. */
export const OCCUPANCY_RATE = 0.35
