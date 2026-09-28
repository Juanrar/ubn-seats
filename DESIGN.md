---
name: "Teatro del Globo · Platea"
description: "Selector de butacas con la voz de un programa de mano: papel, tinta y bronce."
colors:
  accent: "#8a6a3b"
  accent-soft: "#a3814d"
  paper: "#f1e8d3"
  paper-2: "#ece1c7"
  ink: "#2b2820"
  ink-soft: "#5a5444"
  ink-mute: "#6f6858"
  rule: "#c9bfa3"
  rule-soft: "#ddd2b4"
typography:
  display:
    fontFamily: "Caveat, Segoe Script, cursive"
    fontSize: "3.25rem"
    fontWeight: 700
    lineHeight: 0.95
  headline:
    fontFamily: "Caveat, Segoe Script, cursive"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1
  title:
    fontFamily: "Caveat, Segoe Script, cursive"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1
  lead:
    fontFamily: "Caveat, Segoe Script, cursive"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.2
  body:
    fontFamily: "Caveat, Segoe Script, cursive"
    fontSize: "1.3125rem"
    fontWeight: 500
    lineHeight: 1.35
  body-sm:
    fontFamily: "Caveat, Segoe Script, cursive"
    fontSize: "1.1875rem"
    fontWeight: 500
    lineHeight: 1.3
  label:
    fontFamily: "Caveat, Segoe Script, cursive"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.25
  figure-inline:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
  figure-count:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.9375rem"
    fontWeight: 500
  figure-total:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "1rem"
    fontWeight: 500
  figure-total-lg:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "1.3125rem"
    fontWeight: 500
  stamp:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.28em"
rounded:
  sm: "4px"
  md: "6px"
  full: "9999px"
spacing:
  stack-tight: "8px"
  stack: "16px"
  stack-loose: "24px"
  gutter: "20px"
  gutter-admin: "16px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 20px"
  button-primary-hover:
    backgroundColor: "{colors.accent-soft}"
  button-outline:
    textColor: "{colors.accent}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
  button-outline-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
  button-text:
    textColor: "{colors.ink-mute}"
    typography: "{typography.body-sm}"
  button-text-hover:
    textColor: "{colors.accent}"
  admin-button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  admin-button-secondary:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  admin-input:
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "44px"
  admin-tab:
    textColor: "{colors.ink-mute}"
    typography: "{typography.body}"
    height: "56px"
  admin-tab-active:
    textColor: "{colors.ink}"
  seat-available:
    backgroundColor: "transparent"
  seat-selected:
    backgroundColor: "{colors.accent}"
  seat-owned:
    backgroundColor: "{colors.ink}"
  seat-occupied:
    backgroundColor: "{colors.rule-soft}"
  ticket-card:
    backgroundColor: "{colors.paper-2}"
    rounded: "{rounded.sm}"
    padding: "20px"
  seat-chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
  selection-bar:
    backgroundColor: "{colors.paper}"
    padding: "16px 20px"
---

# Design System: Teatro del Globo · Platea

## Overview

**Creative North Star: "El programa de mano"**

La Platea se lee como el programa impreso que se reparte en la puerta de una muestra de fin de año. Tiene papel crema, tinta marrón oscura, títulos escritos a mano y un único color con tono, el bronce, reservado para lo que el visitante eligió o tiene que tocar. El papel está en el color de fondo y la tinta en la tipografía. No hay texturas ni ilustraciones que lo imiten.

El mapa de la sala es el centro de cada pantalla del selector. El resto es anotación alrededor del mapa: la cabecera con la flecha para volver a las funciones, la leyenda, el panel de la selección. Todo es plano. Las zonas se separan con reglas de 1px y, cuando hace falta más, con un paso de papel más oscuro. Los estados se distinguen por relleno, contorno y texto, nunca sólo por color.

El panel de administración usa el mismo papel y la misma letra con otro registro, el de una libreta de trabajo. El botón principal es de tinta en lugar de bronce, los radios pasan de 4px a 6px, los objetivos táctiles miden 44px y la navegación son pestañas fijas abajo. El sistema no es una app SaaS genérica, con tarjetas con sombra, azul de marca, íconos de librería y una sans-serif neutra. Tampoco es un scrapbook, con cinta adhesiva, texturas de papel, clips o trazos temblorosos.

**Key Characteristics:**
- Caveat en peso 500 para toda la interfaz, con una escala de tamaños propia.
- JetBrains Mono sólo para montos, contadores e ids.
- Un solo color con tono, el bronce de sala. El resto es papel y tinta.
- Plano: reglas de 1px, sin sombras ni gradientes.
- Claro y oscuro con los mismos nombres de token.
- Movimiento sólo al entrar: la sala aparece desde el escenario y el login se revela una vez.

## Colors

Papel y tinta con un solo acento cálido. Cada token se redefine con el mismo nombre dentro de `.dark`.

### Primary
- **Bronce de sala** (#8a6a3b): butaca seleccionada, botón "Continuar", botón de login, logo, anillo de foco de las butacas y borde de la tarjeta de entrada. En oscuro pasa a #d4a76a.
- **Bronce claro** (#a3814d): hover del botón primario del sitio público. En oscuro pasa a #b8966a.

### Neutral
- **Papel** (#f1e8d3): fondo de todas las páginas y de la barra de selección fija, y texto sobre bronce y sobre tinta. En oscuro pasa a #1f1c16. Es también el `theme-color` del navegador, que `lib/theme.ts` repite en `THEME_COLORS`.
- **Papel tostado** (#ece1c7): superficies un paso por debajo de la página, como el escenario, la tarjeta de entrada y la barra de acciones del admin. En oscuro pasa a #1a1813.
- **Tinta** (#2b2820): texto principal, butacas "Tuyas", botón primario del admin y pestaña activa. En oscuro pasa a #ece2cb.
- **Tinta media** (#5a5444): texto secundario dentro de tarjetas y rótulo del escenario. En oscuro pasa a #bfb59b.
- **Tinta tenue** (#6f6858): ayudas, leyenda, estados vacíos y contorno de la butaca disponible. En oscuro pasa a #9d9482.
- **Regla** (#c9bfa3): separadores de 1px, bordes de menús, inputs y botones secundarios, y contorno del escenario. En oscuro pasa a #3a3528.
- **Regla suave** (#ddd2b4): divisores dentro de listas y relleno de la butaca ocupada. En oscuro pasa a #2c281d.

Contraste medido sobre papel en el tema claro: tinta 12,1:1, tinta media 6,2:1 y tinta tenue 4,5:1 (4,3:1 sobre papel tostado). El bronce como texto sobre papel, y el papel como texto sobre bronce, dan 4,1:1. El papel sobre bronce claro da 3,0:1. Esos tres casos no llegan al 4,5:1 que WCAG AA pide para texto de cuerpo. En oscuro todos pasan: bronce 7,7:1 y bronce claro 6,2:1.

### Named Rules
**La regla del bronce escaso.** El bronce marca lo que el visitante eligió o la próxima acción que tiene que tocar. No se usa para decorar, para títulos ni para distinguir sectores.

**La regla del monocromo.** Ningún estado depende sólo del color. La butaca seleccionada cambia de relleno y además aparece en la lista del panel. El sector se distingue por posición y etiqueta.

## Typography

**Display Font:** Caveat (with Segoe Script, cursive)
**Body Font:** Caveat (with Segoe Script, cursive)
**Mono Font:** JetBrains Mono (with ui-monospace, monospace)

**Character:** Caveat es la voz de toda la interfaz, de los títulos a los botones. JetBrains Mono aparece sólo donde una cifra o un id tiene que alinearse o copiarse. Lora está cargada como `--font-prose` para textos largos que todavía no existen, y ninguna pantalla la usa.

### Hierarchy
- **Display** (Caveat, 700, 3.25rem, 0.95): título del login y títulos de página de "Mis entradas" y del panel de admin.
- **Headline** (Caveat, 700, 2rem, 1): nombre de la sala en la cabecera, título de la página de pago y secciones del admin.
- **Title** (Caveat, 600, 2rem, 1): títulos dentro de un panel o una tarjeta, como "Tu selección" o el nombre de la obra en la entrada.
- **Lead** (Caveat, 500, 1.5rem, 1.2): la palabra "Total" del panel de selección.
- **Body** (Caveat, 500, 1.3125rem, 1.35): texto corriente, botones y filas de lista.
- **Body small** (Caveat, 500, 1.1875rem, 1.3): leyenda, menú de usuario, mensajes de estado y acciones secundarias.
- **Label** (Caveat, 500, 1.125rem, 1.25): categoría de la butaca bajo su número y rótulos de los contadores del admin.
- **Figure inline** (JetBrains Mono, 500, 0.8125rem): montos e ids dentro de una línea de texto.
- **Figure count** (JetBrains Mono, 500, 0.9375rem): contadores del admin (vendidas, bloqueadas, libres).
- **Figure total** (JetBrains Mono, 500, 1rem): total del panel de selección y de la barra fija.
- **Figure total large** (JetBrains Mono, 500, 1.3125rem): total de la entrada y de la página de pago.
- **Stamp** (JetBrains Mono, 500, 0.75rem, 0.28em, mayúsculas): sólo el sello "TEATRO DEL GLOBO · PLATEA" del login.

El precio por butaca del panel de selección todavía usa 12px (`text-xs`). Pasa a 13px, el tamaño de Figure inline.

### Named Rules
**La regla de la escala propia.** Caveat se dimensiona con las clases `text-hand-*` y nunca con `text-sm` o `text-base`. Su altura de x es baja y necesita cerca de un 35% más de tamaño para leerse igual que una sans-serif.

**La regla del peso 500.** El cuerpo va en 500, porque con 400 el trazo queda demasiado fino sobre el papel. El 600 y el 700 quedan para títulos.

**La regla de la caja baja.** No hay mayúsculas sostenidas ni versalitas. El rótulo del escenario es "Escenario". La única excepción es el sello del login.

## Layout

El sitio público es una columna centrada de 960px como máximo (`--layout-stack`) con 20px de margen lateral. Desde 1024px el panel de selección se ubica a la derecha del mapa, con 288px de ancho y fijo a 32px del borde superior al hacer scroll. Por debajo de ese ancho el panel va bajo el mapa, separado por una regla.

El mapa nunca baja de 560px de ancho (480px en el admin). En pantallas más angostas se desplaza de costado dentro de su contenedor y las butacas conservan su tamaño. Cuando hay al menos una butaca elegida aparece la barra de selección fija abajo, y la página suma 112px de margen inferior para que la barra no tape contenido.

"Mis entradas" es una columna de lectura de 720px como máximo (`--reading-max`). El panel de admin usa 768px de ancho máximo y 16px de margen lateral, con las pestañas fijas abajo (56px más el área segura del dispositivo) y la barra de acciones del mapa pegada justo encima de ellas. El login es una columna de 320px que ocupa el alto exacto de la pantalla, sin scroll. La página de resultado de pago centra su contenido en los dos ejes.

El espaciado sigue la escala de 4px de Tailwind. Dentro de un bloque los elementos se separan con 8px, 12px o 16px; entre bloques de una página, con 24px en el sitio público y 16px en el admin.

### Named Rules
**La regla del mapa primero.** El mapa se queda con el ancho disponible y el panel lo acompaña. En pantallas chicas el mapa se desplaza de costado; no se achica hasta volver ilegibles las butacas.

## Elevation & Depth

El sistema es plano. No hay sombras ni gradientes. La profundidad se arma con dos recursos: la regla de 1px (`rule` entre bloques, `rule-soft` dentro de listas) y un paso tonal, el papel tostado, para lo que está un nivel por debajo de la página. Los elementos fijos, como la barra de selección y las pestañas del admin, se separan del contenido con una regla superior y un fondo de papel opaco.

### Named Rules
**La regla de la regla.** Si dos zonas necesitan separarse, va una regla de 1px. Si hace falta más, un paso de papel tostado. Nunca una sombra.

## Shapes

Los radios son chicos: 4px en el sitio público (botones, menú, tarjeta de entrada, chips de butaca) y 6px en el admin (botones, buscador, contadores, avisos). El círculo completo queda sólo para el avatar. Los bordes miden 1px. Hay dos excepciones de 2px: la pestaña activa del admin y el contorno de foco de la butaca.

La butaca es un rectángulo de 20 × 17 unidades del plano con esquinas de 1 unidad, rotado para seguir el arco de su fila. El escenario es un rectángulo con las esquinas superiores redondeadas por una curva de 22 unidades.

## Components

### Buttons
- **Shape:** esquinas de 4px en el sitio público (`rounded-sm`) y de 6px en el admin (`rounded-md`).
- **Primary:** fondo bronce, texto papel en tamaño Body, 8px por 20px de padding ("Continuar"). El de login es más grande, con 46px de alto mínimo, 24px de padding lateral y un globo de 20px dibujado con trazo.
- **Hover / Focus:** el hover pasa a bronce claro con una transición de color de 150ms. El foco usa el contorno del navegador; la butaca es el único elemento con anillo propio. Deshabilitado baja a 50% de opacidad.
- **Outline:** borde de 1px y texto en bronce ("Descargar entradas"). En hover se llena de bronce con texto papel.
- **Text:** sin fondo ni borde, en tinta tenue o tinta media ("Vaciar", "Reenviar al mail", la × de quitar butaca). El hover pasa a bronce.
- **Primary (admin):** fondo tinta, texto papel en negrita, 44px de alto mínimo y sin hover. Deshabilitado baja a 60%.
- **Secondary (admin):** borde de regla y texto tinta en peso 500, mismo alto. Las acciones que no se pueden deshacer van en una grilla de dos columnas, con la secundaria a la izquierda para volver atrás y la primaria a la derecha para confirmar.

### Chips
- **Style:** cada butaca de la tarjeta de entrada es un chip de papel sobre papel tostado, con borde de regla, esquinas de 4px, 8px de padding lateral y texto Body small.
- **State:** no tienen estados. Son etiquetas, no filtros.

### Cards / Containers
- **Corner Style:** 4px en el sitio público y 6px en el admin.
- **Background:** la tarjeta de entrada usa papel tostado. Los estados vacíos y los contadores del admin usan el papel de la página.
- **Shadow Strategy:** ninguna. Ver Elevation & Depth.
- **Border:** 1px de bronce en la tarjeta de entrada, la única con borde de acento porque es lo que el visitante compró. 1px de regla en el resto.
- **Internal Padding:** 20px en la tarjeta de entrada y en los estados vacíos. 12px por 8px en los contadores del admin, con la cifra arriba y el rótulo abajo.

### Inputs / Fields
- **Style:** el buscador del admin tiene borde de regla, esquinas de 6px, fondo transparente y 44px de alto. La contraseña del login del admin tiene sólo una regla inferior.
- **Focus:** la regla inferior de la contraseña pasa a bronce.
- **Error / Disabled:** los errores son texto en tinta o tinta tenue con `role="alert"`. En el admin, el aviso de venta deshabilitada va en una caja con borde de tinta de 1px. No hay rojo ni íconos de advertencia.

### Navigation
- **Cabecera pública:** grilla de tres columnas con el avatar de 32px a la derecha, cerrada por una regla inferior (`SiteHeader`). En la lista de funciones lleva el logo de 44px en bronce a la izquierda y el nombre de la sala en Headline al centro. En el selector el logo se reemplaza por la flecha atrás, en tinta con hover bronce y área de 44px, con el texto "Funciones" desde 640px; al centro va la función en Headline ("Sábado 5") con "21 h · Platea" debajo en Body small y tinta tenue. Debajo de 640px la cabecera del selector queda fija arriba sobre papel opaco.
- **Lista de funciones:** un renglón por función separado por reglas. A la izquierda el día en Display con el mes corto debajo en tinta tenue; al centro el día de la semana y la hora en Lead. En escritorio "Ver disponibilidad" es texto bronce con flecha que se corre 4px con el hover. Debajo de 640px la fecha se separa con una regla vertical `rule-soft`, la hora baja debajo del día en Body small, y "Ver disponibilidad" es un botón con borde bronce de 44px de alto; al apretar, el renglón pasa a papel tostado y el botón se llena de bronce. Debajo de 360px el botón ocupa el ancho completo. El título de la obra usa `text-wrap: balance`.
- **Aviso de salida:** `<dialog>` modal de 420px como máximo, en papel con borde de regla y esquinas de 4px, sobre un velo de papel al 75%. Título en Headline, texto en Body y dos botones en grilla: secundario "Seguir eligiendo" a la izquierda, primario bronce "Volver igual" a la derecha.
- **Pestañas de función del admin:** grupo con borde de regla y esquinas de 6px, un link por función ("Sáb 5") de 44px de alto. La elegida va en negrita sobre papel tostado con regla inferior de 2px en tinta.
- **Menú de usuario:** desplegable de 224px bajo el avatar, en papel con borde de regla y esquinas de 4px. Los ítems se separan con reglas y el selector de tema va al final.
- **Selector de tema:** dos cuadrados de 28px con sol y luna dentro de un grupo con borde. El activo se llena de bronce.
- **Pestañas del admin:** fijas abajo, tres de igual ancho y 56px de alto, en tamaño Body. La activa lleva una regla superior de 2px en tinta y va en negrita; las inactivas van en tinta tenue.

### Butaca
El componente propio del sistema. Mide 20 × 17 unidades con contorno de 1 unidad.
- **Disponible:** sin relleno y contorno de tinta tenue. En hover el contorno pasa a bronce.
- **Seleccionada:** relleno y contorno de bronce.
- **Tuya:** relleno de tinta con una tilde de papel encima.
- **Ocupada:** relleno de regla suave, sin contorno. No responde al click.
- **Foco:** contorno de bronce de 2 unidades.
- **Admin:** la bloqueada lleva contorno de tinta y una cruz; la reservada, contorno punteado (1,5 y 1); la vendida se ve como la ocupada pero se puede tocar para abrir su orden.
- **Entrada:** cada butaca crece de 60% a 100% y aparece en 480ms, con un retraso que depende de su distancia al escenario (hasta 950ms). La sala se llena desde el escenario hacia el fondo. Con `prefers-reduced-motion` aparece sin animación.

### Escenario y leyenda
El escenario tiene relleno de papel tostado, contorno de regla y el rótulo "Escenario" en Caveat 600, tinta media y espaciado de 0.24em. La leyenda es una fila con las cuatro butacas del selector público a tamaño real y su nombre en Body small, en tinta tenue.

### Login
El logo de 190px se revela de abajo hacia arriba en 2000ms. Detrás, cuatro arcos de regla se expanden y se desvanecen en un ciclo de 5200ms, escalonados cada 1300ms. Los textos suben 10px en 800ms, uno detrás de otro entre los 900ms y los 1300ms. Con `prefers-reduced-motion` todo aparece quieto.

## Do's and Don'ts

### Do:
- Usá los tokens de color de `@theme`. Un componente no lleva hex sueltos.
- Dimensioná Caveat con `text-hand-*` y dejá el cuerpo en peso 500.
- Reservá JetBrains Mono para montos, contadores e ids, con los cuatro tamaños de Typography.
- Separá con reglas de 1px: `rule` entre bloques y `rule-soft` dentro de listas.
- Dale el bronce sólo a lo seleccionado y a la acción principal del sitio público.
- Comunicá cada estado con algo más que color: relleno, contorno, cruz, punteado o texto.
- Poné cada animación nueva detrás de `prefers-reduced-motion: reduce`.
- En el admin, usá los botones de `components/admin/buttons.ts`, con 44px de alto.

### Don't:
- No uses sombras ni gradientes.
- No escribas en mayúsculas sostenidas ni en versalitas, salvo el sello del login.
- No uses `text-sm`, `text-base` ni el resto de la escala de Tailwind para Caveat.
- No distingas sectores ni estados sólo por color.
- No uses rojo, verde ni íconos de advertencia para errores o confirmaciones. El mensaje va en texto.
- No armes la interfaz de una app SaaS genérica, con tarjetas con sombra, azul de marca, íconos de librería o una sans-serif neutra.
- No imites el papel con texturas, cinta adhesiva, clips ni trazos temblorosos. El papel es un color.
- No uses Lora hasta que exista un texto largo que la necesite.
