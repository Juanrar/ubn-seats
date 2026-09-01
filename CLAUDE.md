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
npm run test:run -- lib/__tests__/seats.test.ts        # un archivo
npm run test:run -- -t "numeración"                    # por nombre de test
```

No hay linter configurado: `typecheck` + tests son la verificación.

## Qué es esto

Selector de butacas del sector **Platea** del Teatro del Globo: reproduce el plano real de la sala en SVG y permite elegir butacas con un panel de resumen. Sin backend, sin checkout, sin persistencia. Es la **base de front** sobre la que se va a añadir lógica y contenido.

El diseño y el plan originales viven en `docs/superpowers/` (untracked). El spec (`specs/2026-08-20-...-design.md`) es la fuente de verdad para geometría, inventario del plano, precios, tokens de color y requisitos de accesibilidad. **Leelo antes de tocar geometría, numeración o precios.** El glosario del dominio está en `CONTEXT.md`.

## Arquitectura

La forma del sistema es una **pipeline determinista y pura** en `lib/`, consumida por un árbol de React que sólo pinta:

```
venue.ts (plano)  ─┐
constants.ts       ├─► seats.ts  buildSeats() ─► Seat[] ─┬─► occupancy.ts  buildOccupancy() ─► Set<id>
numbering.ts       │   (compone todo)                     ├─► navigation.ts nextSeatId()
geometry.ts        │                                      └─► PlateaPicker ─► SeatMap ─► SeatArc ─► SeatButton
pricing.ts        ─┘                                                        └─► SelectionPanel / Legend
```

Reglas que sostienen esa forma — respetalas:

- **Todo módulo bajo `lib/` es puro.** Sin `import` de React, sin `window`, sin `document`, sin `Math.random`. Ahí vive la lógica verificable y ahí vive el TDD.
- **Los componentes no hacen aritmética de geometría.** Consumen `Seat` ya resueltas (con `x`, `y`, `angle` calculados) y las pintan.
- **`venue.ts` es la única fuente del plano.** Corregir un conteo de filas o butacas toca *sólo* ese archivo: geometría, numeración, precios y encuadre se recalculan solos.
- **El `viewBox` nunca se hardcodea.** Sale del bounding box de las butacas generadas más el escenario (`SeatMap.tsx` + `seatBounds`). Cambiar una constante no rompe el encuadre.
- **`geometry.ts` trabaja en radianes; `Seat.angle` se expone en grados** porque es lo que consume `transform="rotate(...)"`. La conversión ocurre en un único lugar, al construir el `Seat`.
- **El `id` de butaca (`platea-F07-12`) es estable y derivable de `(sector, fila, número)`**, no de la geometría: la selección puede serializarse a URL o `localStorage`.

### Determinismo e hidratación (dos decisiones fáciles de romper)

Next.js renderiza el mapa en el servidor y en el cliente. Dos cosas lo mantienen idéntico en ambos lados:

1. **PRNG con semilla (`mulberry32`, semilla `20260820`) en vez de `Math.random`.** `Math.random` daría un mapa de ocupación distinto en cada lado y rompería la hidratación. `buildOccupancy` ordena por `id` antes de sortear para no depender del orden de entrada, y los espacios accesibles consumen un número del PRNG aunque nunca se ocupen — así el patrón del resto no depende de esa regla.
2. **`round3` en `lib/seats.ts`.** `Math.sin`/`cos` no están garantizados bit a bit entre implementaciones de JS, y esa diferencia de 1 ULP se serializa distinto en el SVG del servidor y del cliente. Todas las coordenadas y ángulos que llegan al DOM pasan por `round3` (que además normaliza `-0` a `0`).

### `WING_INNER_OFFSET` es constante a propósito

Vale `11` (= `7.5 + 1 + AISLE_GAP`, la posición que corresponde a una fila de 16) y **no se deriva** de la semianchura de cada fila. Las filas 15 (14 butacas) y 16 (sin bloque central) tienen el centro más angosto; derivarlo de ahí correría el ala hacia adentro y torcería una columna que en el plano está recta. El espacio accesible **sí** se deriva de la semianchura, porque en el plano abraza el borde del bloque central.

### Interacción y accesibilidad

Requisitos del spec, no adornos:

- Cada butaca es un `role="button"` dentro del SVG, con `aria-label` completo ("Fila 7, butaca 12, Platea B, 38.000 pesos, disponible").
- **Roving `tabindex`**: la Platea entera es *una sola* parada de tabulación. Flechas mueven entre butacas (`nextSeatId`), Enter/Espacio alterna. Mover el foco lógico no mueve el foco del DOM por sí solo: `PlateaPicker` lo hace explícitamente con un `pendingFocus` ref + `useEffect` que busca por `data-seat-id`.
- Las ocupadas son `aria-disabled` y no responden al click.
- Región `aria-live="polite"` en `SelectionPanel` que anuncia selección y total.
- **Ningún estado se comunica sólo por color**: la seleccionada cambia de relleno *y* aparece en la lista del panel; la accesible se distingue por trazo `dashed`.
- Monocromático: el sector se distingue por posición y etiqueta, nunca por color.

## Estilo

Tailwind v4 con tokens declarados en `@theme` de `app/globals.css` (paleta `paper-bg`, `ink`, `ink-soft`, `ink-mute`, `rule`, `rule-soft`, `accent`, `highlight`; claro y oscuro). Tipografías vía `next/font/google`: **Lora** (títulos/prosa), **JetBrains Mono** (números y tabla), **Caveat** (`font-hand`, una anotación suelta). Sin sombras, sin gradientes, radios chicos, separadores como reglas de 1px. El tema se resuelve con script inline anti-flash en `layout.tsx` + `lib/theme.ts` (`light` / `dark` / `system`).

## Git

- Un commit por unidad de trabajo, en `main`. No se hace `push`: queda en manos del usuario.
- **Nunca `git add -A` ni `git add .`** — stagear por nombre. Hay cosas en el working tree que **no se commitean**: `plan.md`, `docs/` y `distribucion-asientos.png`. Verificar con `git status --short` antes de cada commit.
