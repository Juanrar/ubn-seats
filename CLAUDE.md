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

La forma del sistema es una **pipeline determinista y pura** en `lib/`, consumida por un árbol de React que sólo pinta:

```
plans/teatro-del-globo.ts   ─►  venue/  buildVenue(plan) ─► Venue ─┬─► occupancy.ts buildOccupancy() ─► Set<id>
        (VenuePlan: dato)           (numbering + pricing           │
                                     + geometry + catalog          ├─► useSeatPicker(venue, occupied) ─► SeatPicker
                                     + labels, detrás del seam)    │        (usa navigation.ts nextSeatId)
                                                                   └─► PlateaPicker ─► SeatMap ─► SeatArc ─► SeatButton
                                                                                    └─► SelectionPanel / Legend
```

Reglas que sostienen esa forma — respetalas:

- **Todo módulo bajo `lib/` es puro.** Sin `import` de React, sin `window`, sin `document`, sin `Math.random`. Ahí vive la lógica verificable y ahí vive el TDD.
- **Los componentes no hacen aritmética de geometría.** Consumen `Seat` ya resueltas (con `x`, `y`, `angle` calculados) y las pintan.
- **El plano es dato: `lib/plans/teatro-del-globo.ts` es la única fuente.** Corregir un conteo de filas o butacas, una tarifa o una constante de geometría toca *sólo* ese archivo: geometría, numeración, precios, etiquetas y encuadre se recalculan solos. Otra sala es otro `VenuePlan`, no código nuevo.
- **`lib/venue/` es un módulo profundo con un seam angosto.** Lo único público es `buildVenue(plan) → Venue` y el tipo `Venue`. `numbering.ts`, `pricing.ts`, `catalog.ts` y `labels.ts` son internos: nada fuera de `lib/venue/` los importa, y el módulo se testea a través del seam (`lib/venue/__tests__/venue.test.ts`), con un `VenuePlan` sintético que prueba que no quedaron constantes del Teatro del Globo escondidas en el código.
- **`lib/geometry.ts` no lee constantes globales.** `rowRadius`, `offsetToTheta`, `placeOnArc` y `placeAtOffset` reciben el `GeometryPlan` como parámetro. `lib/constants.ts` guarda sólo lo que no es del plano: `MAX_SEATS`, `OCCUPANCY_SEED`, `OCCUPANCY_RATE`.
- **El `viewBox` nunca se hardcodea ni se calcula en un componente.** Sale de `Venue.viewBox`: el bounding box de las plazas más el escenario más `plan.framePadding`. Cambiar una constante del plano no rompe el encuadre.
- **La máquina de estados del selector vive en `hooks/useSeatPicker.ts`,** no en el árbol de React. `useSeatPicker(venue, occupied)` concentra selección, tope, foco lógico, movimiento del foco real del DOM, teclas, orden de la selección y total. `PlateaPicker` es sólo layout: sin `useRef`, sin `useEffect`, sin `useCallback`. `SelectionPanel` recibe `seats` y `total` y sólo pinta.
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

- Cada butaca es un `role="button"` dentro del SVG, con `aria-label` completo ("Fila 7, butaca 12, Platea B, 38.000 pesos, disponible").
- **Roving `tabindex`**: la Platea entera es *una sola* parada de tabulación. Flechas mueven entre butacas (`nextSeatId`), Enter/Espacio alterna. Mover el foco lógico no mueve el foco del DOM por sí solo: `useSeatPicker` lo hace explícitamente con un `pendingFocus` ref + `useEffect` que busca por `data-seat-id` con `CSS.escape`.
- Las ocupadas son `aria-disabled` y no responden al click.
- Región `aria-live="polite"` en `SelectionPanel` que anuncia selección y total.
- **Ningún estado se comunica sólo por color**: la seleccionada cambia de relleno *y* aparece en la lista del panel.
- Monocromático: el sector se distingue por posición y etiqueta, nunca por color.

## Estilo

Tailwind v4 con tokens declarados en `@theme` de `app/globals.css` (paleta `paper-bg`, `ink`, `ink-soft`, `ink-mute`, `rule`, `rule-soft`, `accent`, `highlight`; claro y oscuro). Tipografías vía `next/font/google`: **Caveat** es la voz de toda la UI (`--font-body` y `--font-hand` apuntan a ella), **JetBrains Mono** queda sólo para cifras donde la alineación en columna es funcional (precio por butaca y total) y **Lora** queda disponible como `--font-prose` para textos largos que todavía no existen.

Caveat no se dimensiona con la escala de Tailwind: su altura de x es baja y necesita ~35% más de tamaño para leerse igual, así que la rampa vive en los tokens `--text-hand-*` (`h1`, `h2`, `lead`, `base`, `sm`, `xs`), cada uno con su `line-height`. Usá esas clases (`text-hand-base`) y no `text-sm`/`text-base`. El cuerpo va en peso 500: con 400 el trazo queda demasiado fino sobre el papel. Tampoco hay versalitas ni caja alta: el rótulo del escenario es "Escenario", no "ESCENARIO". Sin sombras, sin gradientes, radios chicos, separadores como reglas de 1px. El tema se resuelve con script inline anti-flash en `layout.tsx` + `lib/theme.ts` (`light` / `dark` / `system`).

## Git

- Un commit por unidad de trabajo. No se hace `push`: queda en manos del usuario.
- **Nunca `git add -A` ni `git add .`** — stagear por nombre. Hay cosas en el working tree que **no se commitean**: `plan.md`, `docs/` y `distribucion-asientos.png`. Verificar con `git status --short` antes de cada commit.
- **Toda feature o implementación nueva arranca en un worktree**, de entrada y sin que haga falta pedirlo: usá el skill `superpowers:using-git-worktrees` al planificar el trabajo, no sólo si el usuario lo menciona. El worktree deja una copia del repo en otra carpeta, sobre su propia rama, mientras `main` en el directorio principal queda libre para seguir usándose en paralelo. Se salta este paso sólo para cambios triviales (un typo, un ajuste de una línea) o si el usuario pide explícitamente trabajar directo sobre `main`.
