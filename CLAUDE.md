# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

Los textos de la UI están en **español rioplatense**. Los identificadores del código, en **inglés**. Los mensajes de commit, en español con prefijo convencional (`feat:`, `fix:`, `test:`, `chore:`).

## Sin comentarios en el código

**No se escriben comentarios.** Nada de `//`, `/* */` ni JSDoc en `lib/`, `hooks/`, `components/` ni `app/`. Sólo código.

El código tiene que explicarse solo: nombres descriptivos, funciones chicas con una responsabilidad, constantes con nombre en lugar de números sueltos, y tests que documenten el comportamiento esperado. Si algo necesita una explicación, va en este archivo, en `CONTEXT.md` o en un ADR — no en el código.

## Comandos

```bash
npm run dev                      # Next.js dev server
npm run build                    # build de producción
npm run typecheck                # tsc --noEmit
npm test                         # Vitest en watch
npm run test:run                 # Vitest una sola vez (CI)
npm run test:run -- lib/venue/__tests__/venue.test.ts  # un archivo
npm run test:run -- -t "numeración"                    # por nombre de test
```

No hay linter configurado: `typecheck` + tests son la verificación.

## Qué es esto

Selector de butacas del sector **Platea** del Teatro del Globo: reproduce el plano real de la sala en SVG y permite elegir butacas con un panel de resumen. Sin backend, sin checkout, sin persistencia. Es la **base de front** sobre la que se va a añadir lógica y contenido.

El diseño y el plan originales viven en `docs/superpowers/` (untracked). El spec (`specs/2026-08-20-...-design.md`) es la fuente de verdad para geometría, inventario del plano, precios, tokens de color y requisitos de accesibilidad. **Leelo antes de tocar geometría, numeración o precios.** El glosario del dominio está en `CONTEXT.md`.

## Arquitectura

La forma del sistema es una **pipeline determinista y pura** en `lib/`, consumida por un árbol de React que sólo pinta. El diseño es **mobile-first**: la sala entera siempre visible arriba, y una sola fila a tamaño de dedo abajo, barrida con una regla — nunca mapa con pinch-zoom más panel lateral.

```
plans/teatro-del-globo.ts   ─►  venue/  buildVenue(plan) ─► Venue ─┬─► occupancy.ts buildOccupancy() ─► Set<id>
        (VenuePlan: dato)           (numbering + pricing           │
                                     + geometry + catalog          ├─► useSeatPicker(venue, occupied) ─► SeatPicker
                                     + labels, detrás del seam)    │        (usa navigation.ts nextSeatId)
                                                                   ├─► useRowFocus(venue) ─► RowFocus
                                                                   └─► PlateaPicker ─┬─► VenueMap   (la sala entera, decorativo, aria-hidden)
                                                                                     ├─► RowBand    (la fila activa a tamaño de dedo, único role="grid")
                                                                                     ├─► RowRule    (la regla: input range, thumb rail)
                                                                                     ├─► SelectionBar (barra fija abajo: "n de 8", total, Continuar)
                                                                                     └─► Confirmation (pantalla final, sin cobro)
```

Reglas que sostienen esa forma — respetalas:

- **Todo módulo bajo `lib/` es puro.** Sin `import` de React, sin `window`, sin `document`, sin `Math.random`. Ahí vive la lógica verificable y ahí vive el TDD.
- **Los componentes no hacen aritmética de geometría.** Consumen `Seat` ya resueltas (con `x`, `y`, `angle` calculados) y las pintan.
- **El plano es dato: `lib/plans/teatro-del-globo.ts` es la única fuente.** Corregir un conteo de filas o butacas, una tarifa o una constante de geometría toca *sólo* ese archivo: geometría, numeración, precios, etiquetas y encuadre se recalculan solos. Otra sala es otro `VenuePlan`, no código nuevo.
- **`lib/venue/` es un módulo profundo con un seam angosto.** Lo único público es `buildVenue(plan) → Venue` y el tipo `Venue`. `numbering.ts`, `pricing.ts`, `catalog.ts` y `labels.ts` son internos: nada fuera de `lib/venue/` los importa, y el módulo se testea a través del seam (`lib/venue/__tests__/venue.test.ts`), con un `VenuePlan` sintético que prueba que no quedaron constantes del Teatro del Globo escondidas en el código.
- **`lib/geometry.ts` no lee constantes globales.** `rowRadius`, `offsetToTheta`, `placeOnArc` y `placeAtOffset` reciben el `GeometryPlan` como parámetro. `lib/constants.ts` guarda sólo lo que no es del plano: `MAX_SEATS`, `OCCUPANCY_SEED`, `OCCUPANCY_RATE`.
- **El `viewBox` nunca se hardcodea ni se calcula en un componente.** El de la sala entera sale de `Venue.viewBox` (bounding box de las plazas más el escenario más `plan.framePadding`); cada `VenueRow` trae además su propio `viewBox` recortado a esa fila, que es el que consume `RowBand`. Cambiar una constante del plano no rompe ningún encuadre.
- **Dos componentes se reparten lo que antes hacía uno solo.** `VenueMap` pinta la sala completa como referencia visual: `aria-hidden="true"`, `focusable="false"`, fuera del árbol de accesibilidad, aunque tocar una fila ahí sigue siendo un atajo (`onPickRow`) para cambiar la fila activa. `RowBand` es la única superficie interactiva real: un `<svg role="grid">` con un `role="row"` y butacas `role="gridcell"`, roving `tabIndex` dentro de esa fila. Ambos comparten `tierWeightOf` (exportado desde `VenueMap`) para que el grosor de trazo de la butaca sea el mismo en los dos.
- **La máquina de estados del selector vive en `hooks/useSeatPicker.ts` y `hooks/useRowFocus.ts`,** no en el árbol de React. `useSeatPicker(venue, occupied)` concentra selección, tope, foco lógico, movimiento del foco real del DOM, teclas, orden de la selección, total y **rechazo** (`rejection: Rejection | null`, con `reason: 'ocupada' | 'tope'` y un mensaje para anunciar). `toggle` ya no ignora en silencio una butaca ocupada o el tope alcanzado: siempre corre, y cuando no puede aplicar el cambio deja el rechazo en el estado para que `SelectionBar` lo anuncie. `useRowFocus(venue)` concentra cuál es la fila activa (`activeRow`, clamped a los límites de la sala), la deriva a partir de una butaca (`focusSeatRow`) y expone `step` para la regla. `PlateaPicker` es sólo layout: sin `useRef`, sin `useEffect`, sin `useCallback` propios — orquesta los dos hooks y pasa props para abajo. `SelectionBar` recibe `seats`, `total` y `rejection`, y sólo pinta.
- **El foco real del DOM se busca sólo dentro de la fila activa.** `useSeatPicker` mueve el foco con un `pendingFocus` ref + `useEffect` que hace `document.querySelector('svg[role="grid"] [data-seat-id=...]')` con `CSS.escape`: el scope a `svg[role="grid"]` es necesario porque `VenueMap` también trae `data-seat-id` en cada butaca (decorativas, sin rol de grid), y sin ese scope la búsqueda podría enganchar el nodo equivocado.
- **`geometry.ts` trabaja en radianes; `Seat.angle` se expone en grados** porque es lo que consume `transform="rotate(...)"`. La conversión ocurre en un único lugar, al construir el `Seat`.
- **El `id` de butaca (`platea-F07-12`) es estable y derivable de `(sector, fila, número)`**, no de la geometría: la selección puede serializarse a URL o `localStorage`.

### Determinismo e hidratación (dos decisiones fáciles de romper)

Next.js renderiza el mapa en el servidor y en el cliente. Dos cosas lo mantienen idéntico en ambos lados:

1. **PRNG con semilla (`mulberry32`, semilla `20260820`) en vez de `Math.random`.** `Math.random` daría un mapa de ocupación distinto en cada lado y rompería la hidratación. `buildOccupancy` ordena por `id` antes de sortear para no depender del orden de entrada.
2. **`round3` dentro de `lib/venue/`.** `Math.sin`/`cos` no están garantizados bit a bit entre implementaciones de JS, y esa diferencia de 1 ULP se serializa distinto en el SVG del servidor y del cliente. Todas las coordenadas y ángulos de cada `Seat` y los cuatro números del `viewBox` pasan por `round3` (que además normaliza `-0` a `0`). Vive en `lib/venue/catalog.ts` y **no se exporta hacia afuera del módulo**: ningún componente redondea nada, porque nada que llegue al DOM sale sin redondear del Recinto. No lo borres ni lo saques del camino.

### `wingInnerOffset` es constante a propósito

Vale `11` (= `7.5 + 1 + aisleGap`, la posición que corresponde a una fila de 16) y **no se deriva** de la semianchura de cada fila. Las filas 15 (14 butacas) y 16 (sin bloque central) tienen el centro más angosto; derivarlo de ahí correría el ala hacia adentro y torcería una columna que en el plano está recta. `geometry.aisleGap` ya no lo lee ninguna función: queda en el plano como el dato que explica esa cuenta, y el test de `lib/plans/` la verifica.

### Interacción y accesibilidad

Requisitos del spec, no adornos:

- `RowBand` es un `<svg role="grid">` con un `role="row"` y cada butaca un `role="gridcell"`, con `aria-label` completo ("Fila 7, butaca 12, Platea B, 38.000 pesos, disponible") y `aria-describedby` apuntando al hint de uso.
- **Roving `tabindex`**: la fila activa es *una sola* parada de tabulación. Flechas mueven entre butacas (`nextSeatId`), Enter/Espacio alterna. Mover el foco lógico no mueve el foco del DOM por sí solo: `useSeatPicker` lo hace explícitamente con un `pendingFocus` ref + `useEffect` que busca por `data-seat-id` con `CSS.escape`, acotado a `svg[role="grid"]`.
- Las ocupadas son `aria-disabled`; `onToggle` sigue corriendo si se las toca, pero `useSeatPicker` responde con un rechazo (`reason: 'ocupada'`) en vez de aplicar el cambio en silencio.
- Región `aria-live="assertive"` en `SelectionBar` que anuncia el rechazo (ocupada o tope alcanzado) y una región `aria-live="polite"` (`sr-only`) que anuncia cuántas butacas hay elegidas y el total.
- **Ningún estado se comunica sólo por color**: la seleccionada cambia de relleno, la ocupada aparece tachada (`<line>`, nunca sólo por color) y toda seleccionada aparece además en la lista de `Confirmation`.
- Monocromático: el sector se distingue por posición y etiqueta, la tarifa por grosor de trazo (`tierWeightOf`), nunca por color.

## Estilo

Tailwind v4 con tokens declarados en `@theme` de `app/globals.css` (paleta `paper-bg`, `ink`, `ink-soft`, `ink-mute`, `rule`, `rule-soft`, `accent`, `highlight`; claro y oscuro). Tipografías vía `next/font/google`, y ya no comparten un solo rol: **Caveat** quedó **sólo display** (`--font-hand`) — el nombre del teatro y el título de `Confirmation`, nada funcional —, **Atkinson Hyperlegible** (`--font-ui`, también `--font-body`) es la que carga todo el texto que hay que leer para decidir (fila, franja, precio, hints, botones, mensajes de rechazo) y **JetBrains Mono** (`--font-mono`) sigue reservada a las cifras donde la alineación en columna es funcional (precio por butaca y total). **Lora** salió del proyecto: no queda ninguna tipografía "para prosa futura" sin usar.

Ninguna de las dos rampas se dimensiona con la escala de Tailwind por defecto. Caveat usa `--text-hand-*` (`h1`, `h2`, `lead`, `base`, `sm`, `xs`): su altura de x es baja y necesita ~35% más de tamaño para leerse igual. Atkinson usa `--text-ui-*` (`xs`, `sm`, `base`, `lead`, `xl`, `2xl`), la rampa de todo lo funcional. Usá `text-hand-*` o `text-ui-*` según el rol del texto — nunca `text-sm`/`text-base` de Tailwind a secas. Tampoco hay versalitas ni caja alta: el rótulo del escenario es "Escenario", no "ESCENARIO". Sin sombras, sin gradientes, radios chicos, separadores como reglas de 1px. El tema se resuelve con script inline anti-flash en `layout.tsx` + `lib/theme.ts` (`light` / `dark` / `system`).

## Git

- Un commit por unidad de trabajo. No se hace `push`: queda en manos del usuario.
- **Nunca `git add -A` ni `git add .`** — stagear por nombre. Hay cosas en el working tree que **no se commitean**: `plan.md`, `docs/` y `distribucion-asientos.png`. Verificar con `git status --short` antes de cada commit.
