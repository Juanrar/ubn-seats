---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["components/PlateaPicker.tsx"]
---

Scope: la ruta única del selector de butacas de Platea (app/page.tsx + components/), en teléfono primero.
Visitor mode: Operate.

Audiencia y trabajo: gente joven, nativa del móvil, comprando entradas desde el teléfono. Entra, entiende la sala, encuentra butacas a un precio que acepta, confirma.

Acción: elegir hasta 8 butacas y llegar a una confirmación simulada.

Contenido y prueba: el plano real del Teatro del Globo (302 butacas, 16 filas, alas desde la fila 6, cuatro tarifas). No hay fotos, logo ni datos de función; no inventarlos.

Restricciones: el plano en arco actual se conserva tal cual (indicación explícita del usuario). Monocromático. Español rioplatense. Papel y tinta, sin sombras ni gradientes.

Dirección elegida: "La regla" (concept-seed 6d9c0709, re-roll 2, índice 4, code-led). El plano entero siempre visible; una regla al alcance del pulgar barre la sala fila por fila; la fila activa se redibuja a tamaño real en una banda debajo, que es donde se toca. Tocar el plano también mueve la regla, así que no hay control nuevo obligatorio.

Momento memorable: la banda. La fila activa se despliega a tamaño de dedo con su precio escrito al lado, mientras la sala entera sigue visible arriba. Ver la sala y poder tocar la butaca dejan de ser excluyentes.

Decisiones sin resolver: si Atkinson Hyperlegible cubre las cifras tabulares y permite retirar JetBrains Mono; si nextSeatId saltea ocupadas por defecto o por parámetro.
