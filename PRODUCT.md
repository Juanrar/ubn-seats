# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Gente comprando entradas de teatro desde el teléfono. La audiencia confirmada es joven y nativa del móvil: cómoda con gestos (pinch-zoom, bottom sheets, swipe), así que la densidad y el vocabulario gestual pueden ser los de una app moderna, no los de un sitio conservador.

El trabajo del usuario: entrar, entender la sala, encontrar butacas que quiera a un precio que acepte, y confirmar. La compra por móvil es el caso principal, no una adaptación del escritorio.

## Product Purpose

Selector de butacas del sector Platea del Teatro del Globo. Reproduce el plano real de la sala y permite elegir butacas con un resumen de la selección. Es una maqueta de front — sin backend, sin pago real, sin persistencia — pensada para mostrarse y para servir de base sobre la que agregar lógica.

Éxito: alguien abre el link en el teléfono, elige sus butacas sin pensar y llega a una confirmación, sin que nada del camino se sienta trabado ni ambiguo.

## Positioning

El plano no es un grid genérico: es el Teatro del Globo. La geometría sale de un `VenuePlan` que codifica la sala real — 16 filas en arco, alas sólo desde la fila 6, fila 16 sin bloque central, cuatro tarifas. Un selector de butacas cualquiera dibuja una cuadrícula; éste dibuja una sala que existe.

## Operating Context

Uso de una sola sesión, en la mano, probablemente de pie o en movimiento, a menudo con una sola mano. Sin login, sin estado guardado entre visitas. El recorrido entero — abrir, elegir, confirmar — ocurre en una pantalla de teléfono.

## Capabilities and Constraints

- Sin backend, sin checkout real, sin persistencia. La confirmación es simulada.
- El flujo termina en una pantalla de confirmación con butacas y total (sin formulario ni pago).
- No hay paso previo de "cuántas entradas": se entra directo al mapa y se tocan butacas.
- El plano es dato (`lib/plans/teatro-del-globo.ts`) y es la única fuente de geometría, numeración, precios y etiquetas. Se conserva tal cual: 302 butacas, 16 filas, alas desde la fila 6, tarifas 45.000 / 38.000 / 30.000 / 24.000.
- Todo módulo bajo `lib/` es puro y se conserva: `venue/`, `geometry.ts`, `occupancy.ts`, `navigation.ts`, `format.ts`. La suite de 146 tests es patrimonio, no lastre.
- Determinismo de hidratación obligatorio: PRNG con semilla y `round3` dentro de `lib/venue/`.
- Tope de selección: `MAX_SEATS = 8`. Confirmado por el usuario; el 6 del brief original queda descartado.
- La ocupación es sintética y fija en 35% con semilla. Estados near-empty y near-sold-out no son alcanzables hoy.

## Brand Commitments

- **Idioma:** todos los textos de UI en español rioplatense ("elegí", "vos"). Identificadores del código en inglés. Vinculante.
- **Monocromático:** ningún estado ni tarifa se comunica por color. El sector se distingue por posición y etiqueta. Vinculante — confirmado explícitamente incluso sabiendo que endurece el problema de legibilidad del mapa.
- **Mundo visual:** se conserva el espíritu papel-y-tinta (fondo crema, tinta, sin sombras ni gradientes, reglas de 1px). La ejecución se moderniza: Caveat queda para display, y lo funcional — precios, números, botones, etiquetas del mapa — pasa a una tipografía legible en pantalla chica.
- Nombre del recinto: Teatro del Globo.

## Evidence on Hand

- `lib/plans/teatro-del-globo.ts`: el plano real, con geometría, inventario, tarifas y etiquetas.
- `docs/superpowers/specs/2026-08-20-...-design.md` (untracked): spec original, fuente de verdad para geometría y accesibilidad.
- `CONTEXT.md`: glosario del dominio.
- `distribucion-asientos.png` (untracked): el plano de referencia.
- No hay imágenes del teatro, ni logo, ni fotos de sala, ni datos reales de función, elenco o disponibilidad. **No inventar ninguno de esos.**

## Product Principles

1. **El teléfono es el producto, no una adaptación.** Cualquier decisión que mejore el escritorio a costa del teléfono está mal.
2. **El mapa tiene que responder la pregunta de compra sin que la toques.** Fila, zona y precio son visibles antes de comprometerse, no después.
3. **Nada falla en silencio.** Tocar una butaca ocupada o pasarse del tope tiene que decir algo, en el lugar donde ocurrió.
4. **El plano es dato.** Otra sala es otro `VenuePlan`, no código nuevo.
5. **La restricción monocromática obliga a ser mejor en etiqueta, peso y textura** que un competidor que codifica por color. No es una excusa para mostrar menos.

## Accessibility & Inclusion

- Objetivos táctiles de 44px como mínimo para la acción principal; nunca por debajo de 24px para las butacas.
- Ningún estado se comunica sólo por color (consecuencia directa de la regla monocromática).
- Región `aria-live` que anuncia selección, total y **rechazos** (ocupada, tope alcanzado).
- Navegación por teclado y lectores de pantalla se conservan del build actual, incluido el roving `tabindex`.
- Contraste real sobre el papel crema: el estado "ocupada" actual (#ddd2b4 sobre #f1e8d3, ~1.1:1) no es aceptable.
