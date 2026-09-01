# CONTEXT.md — Modelo de dominio

Glosario del dominio de `ubn-seats`. Los nombres de acá son los que deben aparecer en el código, en los tests y en las conversaciones sobre arquitectura. Si aparece un concepto nuevo, se agrega acá antes de nombrarlo en el código.

Convención: el término del dominio está en **español** (lo habla el plano y el usuario); el identificador del código, en inglés, entre paréntesis.

## El recinto

**Recinto** (`Venue`) — El módulo `lib/venue/` y el objeto que devuelve `buildVenue(plan)`. Es el seam entre los datos del plano y todo lo demás: recibe un **Plan del recinto** y entrega el catálogo de butacas ya resuelto (`seats`, `byId`, `rows`), el encuadre (`bounds`, `viewBox`), el escenario (`stage`) y el tope de compra (`maxSeats`). "Sector Platea del Teatro del Globo" ya no es una propiedad del código: es el dato que se le pasa. Sus piezas internas (`numbering.ts`, `pricing.ts`, `catalog.ts`, `labels.ts`) no se importan desde afuera; el único punto público es `lib/venue/index.ts`.

**Plan del recinto** (`VenuePlan`) — El dato declarativo que describe una sala: identidad (`id`, `name`, `sectionName`), `geometry`, `stage`, `rows`, `centerBlock`, `wings` y `framePadding`. Cero lógica. El del Teatro del Globo vive en `lib/plans/teatro-del-globo.ts`. Agregar otra sala es agregar otro plano, no tocar el Recinto.

**Plano** — El documento fuente (`distribucion-asientos.png`, untracked) del que se leyeron todos los conteos. Cuando el código y el plano discrepan, gana el plano; la corrección se hace en `lib/plans/teatro-del-globo.ts`.

**Sector** (`SectorId`) — Una zona del teatro con precio y tratamiento propios. Los tres que existen hoy son `platea` (bloque central), `platea-ala-izq` y `platea-ala-der`. Fuera del alcance actual pero **dentro del modelo de datos**: Superpullman, Pullman, Palcos Altos Libertad y Palcos Altos Cerrito.

**Platea** — El sector del nivel inferior, el único implementado. 16 filas.

**Fila** (`row`) — Un arco concéntrico de butacas. **Siempre 1-indexada**, igual que el plano — nunca 0-indexada en la interfaz pública. Cada fila se describe con un `RowPlan`: `{ row, center, wing }`.

**Bloque central** (`center`) — Las butacas de la fila que están entre los dos pasillos. 14 butacas en las filas 1 y 15, 16 en las filas 2–14. **La fila 16 no tiene bloque central**: existe sólo en las alas.

**Ala** (`wing`) — La columna lateral de butacas por fuera del pasillo, izquierda y derecha. 3 butacas por lado, filas 6 a 16. A diferencia del bloque central, el ala es una **columna recta**, no un arco que sigue la fila — de ahí que su offset sea una constante del plano (`geometry.wingInnerOffset`, 11) y no se derive de la fila.

**Pasillo** (`geometry.aisleGap`) — La separación entre el bloque central y el ala, medida en unidades de `geometry.seatPitch` (vale 2,5). No es un objeto en el modelo ni lo lee ninguna función: es el dato que explica el `11` de `wingInnerOffset` (`7,5 + 1 + 2,5`), y el test del plano verifica esa cuenta.

## Las butacas

**Butaca** (`Seat`) — Lo único que una persona puede ocupar: 236 en el bloque central + 66 en las alas = **302 en total**. No hay otra clase de plaza; el `aria-label` de cada una lo arma `lib/venue/labels.ts` al construir el catálogo.

**Número de butaca** (`number`) — La numeración del plano: **desde el centro hacia afuera**, impares a la izquierda y pares a la derecha. Una fila de 14 queda `13 11 9 7 5 3 1 | 2 4 6 8 10 12 14`. Las alas continúan la serie: izquierda `17, 19, 21`; derecha `18, 20, 22`. No confundir con el índice posicional dentro de la fila.

**Id de butaca** (`Seat.id`) — `"<sector>-F<fila con 2 dígitos>-<número>"`, p. ej. `platea-F07-12`. Estable y derivable de `(sector, fila, número)`, **nunca de la geometría**: así la selección puede serializarse a URL o `localStorage` sin depender de las constantes del plano.

**Estado de butaca** (`SeatStatus`) — `available` | `occupied` | `selected`. Es un valor **derivado**, no almacenado: se calcula cruzando la selección con la ocupación (`statusOf`).

## Precio

**Franja** (`TierPlan`, `Seat.tier`) — La banda de precio de una butaca, con su etiqueta visible: **Platea A** (bloque central, filas 1–5, 45.000), **Platea B** (filas 6–10, 38.000), **Platea C** (filas 11–15, 30.000) y **Ala lateral** (24.000). Es **dato**, no código: las del bloque central son la lista `centerBlock.tiers` del plano, en orden creciente de fila, donde cada entrada vale hasta su `throughRow` y la última —sin `throughRow`— cubre el resto. Las alas tienen una sola tarifa. La franja se resuelve al construir el catálogo y queda en `Seat.tier` y `Seat.price`: ningún componente calcula precios.

**Precedencia de sector sobre fila** — Regla del dominio: el sector manda. Una butaca del ala en la fila 7 cuesta tarifa de ala (24.000), no Platea B. Queda expresada **por construcción** en `lib/venue/pricing.ts`: el ala tiene su propia tarifa en el plano y nunca consulta las franjas del bloque central. No depende del orden de una cadena de `if`.

## Geometría

Toda la aritmética del plano vive en `lib/geometry.ts` —pura y **parametrizada por `GeometryPlan`**, sin constantes globales— y se aplica en `lib/venue/catalog.ts`.

**Centro de curvatura** (`geometry.center`) — El punto sobre el escenario alrededor del que se trazan los arcos de las filas. Es `(0, 0)`; todas las coordenadas de butaca son relativas a él. En SVG el eje `y` crece hacia abajo, así que el centro queda *por encima* de las filas.

**Radio de fila** (`rowRadius`) — `firstRowRadius + (fila − 1) · rowPitch`. Las filas "sonríen": los extremos quedan más cerca del escenario que el centro de la fila. Ésa es la firma de una sala donde cada butaca encara al escenario, y se verificó contra el plano.

**Paso de butaca** (`geometry.seatPitch`) — Separación entre centros de butacas contiguas, medida **sobre el arco** (24). Dividir el paso angular por el radio (`offsetToTheta`) es lo que mantiene el **tamaño de butaca constante** entre filas: las filas de atrás son más largas en cantidad de butacas, no en tamaño de butaca.

**Offset** — La posición lateral de una butaca dentro de su fila, expresada como **número con signo en unidades de `seatPitch` desde el centro de la fila**: negativo hacia la izquierda, positivo hacia la derecha. Es la unidad en la que se razona todo el layout antes de pasar a coordenadas.

**Semianchura** (`halfWidth`, `h`) — `(center − 1) / 2` de la fila. Ubica las butacas del bloque central alrededor del centro de la fila; el ala **no** se deriva de ella.

**Ángulo** (`Seat.angle`) — La rotación de la butaca para que encare al centro de curvatura. `geometry.ts` calcula en **radianes**; `Seat.angle` se expone en **grados**, porque es lo que consume `transform="rotate(...)"` de SVG. La conversión ocurre en un solo lugar.

**Encuadre** (`Venue.viewBox`, `Venue.bounds`) — Nunca se hardcodea ni se calcula en un componente: lo arma `buildVenue`. `bounds` es la caja de las butacas más media diagonal de butaca, para que la rotación no corte ninguna; `viewBox` es el string listo para el `<svg>`, con ese `bounds` más el escenario más `plan.framePadding`, y sus cuatro números redondeados a 3 decimales. Cambiar cualquier constante del plano no rompe el encuadre.

## Selección y ocupación

**Ocupación** (`buildOccupancy` → `Set<string>` de ids) — Qué butacas ya están tomadas. Hoy es **simulada y determinista**: un PRNG con semilla fija (`mulberry32`, semilla `20260820`) con una tasa del 35 %. Determinista a propósito — `Math.random` daría un mapa distinto en servidor y cliente y rompería la hidratación de Next.js. Es el punto por donde entrará una fuente real (API/DB) cuando exista.

**Selector** (`SeatPicker`, `hooks/useSeatPicker.ts`) — La máquina de estados de la elección, detrás de un seam: `useSeatPicker(venue, occupied)`. Concentra la selección, el tope, el foco lógico, el movimiento del foco real del DOM, el despacho de teclas (flechas, `Enter`, espacio), la selección ya ordenada (`selectedSeats`) y el `total`. `PlateaPicker` es sólo layout y `SelectionPanel` sólo pinta lo que recibe: ninguno de los dos ordena, suma ni maneja foco.

**Selección** (`SeatPicker.selectedSeats`) — Las butacas que la persona eligió, ordenadas por fila y después por número, con un **tope** por compra (`Venue.maxSeats`, hoy `MAX_SEATS = 8`). Las ocupadas nunca entran, ni siquiera llamando a `toggle` a mano.

**Foco lógico** (`SeatPicker.focusedId`) — Cuál butaca tiene el cursor del teclado. Distinto del foco del DOM: mover el foco lógico obliga a mover explícitamente el foco real, y eso lo hace el propio hook con un `pendingFocus` ref más un `useEffect` que busca por `data-seat-id`, porque el roving `tabindex` por sí solo no lo hace.

**Vecindad** (`nextSeatId`, `Direction`) — Qué butaca está a la izquierda/derecha/arriba/abajo de otra. Izquierda y derecha se mueven por orden de `x` dentro de la fila; arriba y abajo saltan a la fila contigua y eligen la más cercana en `x` — así funciona aunque las filas tengan distinta cantidad de butacas o falte el bloque central. En los bordes devuelve el mismo id: la selección no se pierde.

## Decisiones tomadas (no re-litigar sin motivo nuevo)

- **PRNG con semilla en vez de `Math.random`** — hidratación. Prohibido `Math.random` en código de producción.
- **`round3` sobre coordenadas, ángulos y los cuatro números del `viewBox`** — vive dentro de `lib/venue/` y no se exporta hacia afuera: `Math.sin`/`cos` no son bit a bit idénticos entre implementaciones de JS, y 1 ULP se serializa distinto en el SVG del servidor y del cliente. También normaliza `-0` a `0`.
- **`geometry.wingInnerOffset = 11` constante, no derivada** de la semianchura de la fila — derivarla torcería la columna del ala en las filas 15 y 16, que en el plano está recta.
- **Sin pinch-zoom propio** sobre un `<g>` — agrega estado de gestos y compite con el zoom nativo del navegador, que ya resuelve el caso. Debajo de `lg` el mapa recibe ancho mínimo de 560 px y su contenedor scrollea.
- **Todo `lib/` es puro** (sin React, sin DOM): es lo que permite que la lógica del plano se testee sin renderizar.
- **El plano es dato, no código** — cinco módulos shallow (`venue`, `numbering`, `geometry`, `pricing`, `seats`) colapsaron en el módulo profundo `lib/venue/`, detrás de `buildVenue(plan)`. Se testea a través del seam, y un `VenuePlan` sintético en los tests demuestra que ninguna constante del Teatro del Globo quedó escondida en el código.
- **La máquina de estados del selector vive en `useSeatPicker`**, no en `PlateaPicker` — el movimiento del foco real del DOM es el punto más frágil del árbol y queda detrás del seam, testeable con `renderHook` sin pintar el SVG.
