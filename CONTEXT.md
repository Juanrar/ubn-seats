# CONTEXT.md — Modelo de dominio

Glosario del dominio de `ubn-seats`. Los nombres de acá son los que deben aparecer en el código, en los tests y en las conversaciones sobre arquitectura. Si aparece un concepto nuevo, se agrega acá antes de nombrarlo en el código.

Convención: el término del dominio está en **español** (lo habla el plano y el usuario); el identificador del código, en inglés, entre paréntesis.

## El recinto

**Recinto** (`Venue`) — El teatro completo. Hoy sólo existe descrito parcialmente: `lib/venue.ts` contiene la configuración del único sector implementado. Escalar a otros sectores o teatros significa que el recinto pase a ser un **dato** (un plano declarativo) en vez de una propiedad del código.

**Plano** — El documento fuente (`distribucion-asientos.png`, untracked) del que se leyeron todos los conteos. Cuando el código y el plano discrepan, gana el plano; la corrección se hace en `lib/venue.ts`.

**Sector** (`SectorId`) — Una zona del teatro con precio y tratamiento propios. Los cuatro que existen hoy son `platea` (bloque central), `platea-ala-izq`, `platea-ala-der` y `platea-accesible`. Fuera del alcance actual pero **dentro del modelo de datos**: Superpullman, Pullman, Palcos Altos Libertad y Palcos Altos Cerrito.

**Platea** — El sector del nivel inferior, el único implementado. 16 filas.

**Fila** (`row`) — Un arco concéntrico de butacas. **Siempre 1-indexada**, igual que el plano — nunca 0-indexada en la interfaz pública. Cada fila se describe con un `RowConfig`: `{ row, center, wing, accessible }`.

**Bloque central** (`center`) — Las butacas de la fila que están entre los dos pasillos. 14 butacas en las filas 1 y 15, 16 en las filas 2–14. **La fila 16 no tiene bloque central**: existe sólo en las alas.

**Ala** (`wing`) — La columna lateral de butacas por fuera del pasillo, izquierda y derecha. 3 butacas por lado, filas 6 a 16. A diferencia del bloque central, el ala es una **columna recta**, no un arco que sigue la fila — de ahí que su offset sea una constante (`WING_INNER_OFFSET`) y no se derive de la fila.

**Pasillo** (`AISLE_GAP`) — La separación entre el bloque central y el ala, medida en unidades de `SEAT_PITCH` (vale 2,5). No es un objeto en el modelo: es un hueco en las posiciones.

## Las plazas

**Plaza** — El término paraguas: cualquier cosa que una persona puede ocupar. Se divide en *butaca* y *espacio accesible*. El total de la Platea es de **308 plazas** = 302 butacas + 6 espacios accesibles. El tipo del código se llama `Seat` para las dos, pero cuando el texto de la UI o un `aria-label` tiene que nombrarlas distingue (ver `seatLabel` y `seatName`).

**Butaca** (`Seat` con `kind: 'standard'`) — Un asiento normal. 302 en total.

**Espacio accesible** (`Seat` con `kind: 'accessible'`, sector `platea-accesible`) — Plaza para silla de ruedas, en el pasillo, uno por lado en las filas 1, 4 y 14. Seis en total. Dos reglas que se olvidan fácil:
- Son plazas **adicionales**: no reemplazan butacas, así que no alteran el `center` de su fila (por eso el total sube a 308).
- **Nunca se ocupan** en la ocupación simulada: son pocos y verlos ocupados al azar arruinaría la demostración de ese estado.

**Número de butaca** (`number`) — La numeración del plano: **desde el centro hacia afuera**, impares a la izquierda y pares a la derecha. Una fila de 14 queda `13 11 9 7 5 3 1 | 2 4 6 8 10 12 14`. Las alas continúan la serie: izquierda `17, 19, 21`; derecha `18, 20, 22`. No confundir con el índice posicional dentro de la fila.

**Id de plaza** (`Seat.id`) — `"<sector>-F<fila con 2 dígitos>-<número>"`, p. ej. `platea-F07-12`. Estable y derivable de `(sector, fila, número)`, **nunca de la geometría**: así la selección puede serializarse a URL o `localStorage` sin depender de las constantes del plano.

**Estado de plaza** (`SeatStatus`) — `available` | `occupied` | `selected`. Es un valor **derivado**, no almacenado: se calcula cruzando la selección con la ocupación (`statusOf`). No confundir con `kind`, que es una propiedad intrínseca de la plaza.

## Precio

**Franja** (`tier`) — La banda de precio de una plaza, con su etiqueta visible: **Platea A** (bloque central, filas 1–5, 45.000), **Platea B** (filas 6–10, 38.000), **Platea C** (filas 11–15, 30.000), **Ala lateral** (24.000), **Espacio accesible** (24.000).

**Precedencia de sector sobre fila** — Regla del dominio: el sector manda. Una butaca del ala en la fila 7 cuesta tarifa de ala (24.000), no Platea B. Está codificada en el orden de los `if` de `lib/pricing.ts`.

## Geometría

Toda la aritmética del plano vive en `lib/geometry.ts` y se aplica en `lib/seats.ts`.

**Centro de curvatura** (`CENTER`) — El punto sobre el escenario alrededor del que se trazan los arcos de las filas. Es `(0, 0)`; todas las coordenadas de butaca son relativas a él. En SVG el eje `y` crece hacia abajo, así que el centro queda *por encima* de las filas.

**Radio de fila** (`rowRadius`) — `R0 + (fila − 1) · ROW_PITCH`. Las filas "sonríen": los extremos quedan más cerca del escenario que el centro de la fila. Ésa es la firma de una sala donde cada butaca encara al escenario, y se verificó contra el plano.

**Paso de butaca** (`SEAT_PITCH`) — Separación entre centros de butacas contiguas, medida **sobre el arco** (24). Dividir el paso angular por el radio (`offsetToTheta`) es lo que mantiene el **tamaño de butaca constante** entre filas: las filas de atrás son más largas en cantidad de butacas, no en tamaño de butaca.

**Offset** — La posición lateral de una plaza dentro de su fila, expresada como **número con signo en unidades de `SEAT_PITCH` desde el centro de la fila**: negativo hacia la izquierda, positivo hacia la derecha. Es la unidad en la que se razona todo el layout antes de pasar a coordenadas.

**Semianchura** (`halfWidth`, `h`) — `(center − 1) / 2` de la fila. El espacio accesible se deriva de ella; el ala **no**.

**Ángulo** (`Seat.angle`) — La rotación de la butaca para que encare al centro de curvatura. `geometry.ts` calcula en **radianes**; `Seat.angle` se expone en **grados**, porque es lo que consume `transform="rotate(...)"` de SVG. La conversión ocurre en un solo lugar.

**Encuadre** (`viewBox`, `seatBounds`, `boundingBox`) — Nunca se hardcodea: sale del bounding box de las plazas generadas más el escenario, con padding. Cambiar cualquier constante del plano no rompe el encuadre.

## Selección y ocupación

**Ocupación** (`buildOccupancy` → `Set<string>` de ids) — Qué plazas ya están tomadas. Hoy es **simulada y determinista**: un PRNG con semilla fija (`mulberry32`, semilla `20260820`) con una tasa del 35 %. Determinista a propósito — `Math.random` daría un mapa distinto en servidor y cliente y rompería la hidratación de Next.js. Es el punto por donde entrará una fuente real (API/DB) cuando exista.

**Selección** (`useSeatSelection` → `selectedIds`) — El conjunto de plazas que la persona eligió, con un **tope de 8** por compra (`MAX_SEATS`). Las ocupadas nunca entran, ni siquiera llamando a `toggle` a mano.

**Foco lógico** (`focusedId`) — Cuál plaza tiene el cursor del teclado. Distinto del foco del DOM: mover el foco lógico obliga a mover explícitamente el foco real (`pendingFocus` ref en `PlateaPicker`), porque el roving `tabindex` por sí solo no lo hace.

**Vecindad** (`nextSeatId`, `Direction`) — Qué plaza está a la izquierda/derecha/arriba/abajo de otra. Izquierda y derecha se mueven por orden de `x` dentro de la fila; arriba y abajo saltan a la fila contigua y eligen la más cercana en `x` — así funciona aunque las filas tengan distinta cantidad de butacas o falte el bloque central. En los bordes devuelve el mismo id: la selección no se pierde.

## Decisiones tomadas (no re-litigar sin motivo nuevo)

- **PRNG con semilla en vez de `Math.random`** — hidratación. Prohibido `Math.random` en código de producción.
- **`round3` sobre coordenadas y ángulos** — `Math.sin`/`cos` no son bit a bit idénticos entre implementaciones de JS, y 1 ULP se serializa distinto en el SVG del servidor y del cliente. También normaliza `-0` a `0`.
- **`WING_INNER_OFFSET = 11` constante, no derivada** de la semianchura de la fila — derivarla torcería la columna del ala en las filas 15 y 16, que en el plano está recta.
- **Sin pinch-zoom propio** sobre un `<g>` — agrega estado de gestos y compite con el zoom nativo del navegador, que ya resuelve el caso. Debajo de `lg` el mapa recibe ancho mínimo de 560 px y su contenedor scrollea.
- **Todo `lib/` es puro** (sin React, sin DOM): es lo que permite que la lógica del plano se testee sin renderizar.
