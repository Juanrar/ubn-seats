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

El diseño y el plan originales viven en `docs/superpowers/` (untracked). El spec (`specs/2026-08-20-...-design.md`) es la fuente de verdad para geometría, numeración, inventario del plano, precios de venta y requisitos de accesibilidad. Sus demás secciones son de la primera versión y lo avisan al principio: lo visual está en `DESIGN.md` y la arquitectura, en este archivo. Los precios de `lib/plans/teatro-del-globo.ts` hoy son de prueba (1, 2 y 3 en el bloque central, 1 en las alas) para probar cobros; los de venta están en el spec. **Leelo antes de tocar geometría, numeración o precios.** El glosario del dominio está en `CONTEXT.md`.

## Arquitectura

La forma del sistema es una **pipeline determinista y pura** en `lib/`, consumida por un árbol de React que sólo pinta:

```
plans/teatro-del-globo.ts   ─►  venue/  buildVenue(plan) ─► Venue ─┬─► app/funciones/[performanceId]/page.tsx (sesión + fetchOccupiedSeatIds de la función) ─► occupied: Set<id>
        (VenuePlan: dato)           (numbering + pricing           │
                                     + geometry + catalog          ├─► useSeatPicker(venue, occupied) ─► SeatPicker
                                     + labels, detrás del seam)    │        (usa navigation.ts nextSeatId)
                                                                   └─► PlateaPicker ─► SeatMap ─► SeatArc ─► SeatButton
                                                                                    └─► SelectionPanel / Legend
```

`utils/supabase/` (clientes de browser y de server), `middleware.ts` (refresco de sesión), `app/actions.ts` (`reserveSeats`, el server action) y `app/auth/callback/route.ts` son la capa de I/O de autenticación y reservas: viven fuera de `lib/` a propósito, con la misma lógica que el resto de esta sección — `lib/` se mantiene puro, el I/O va en los bordes.

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

Vale `11` (= `7.5 + 1 + aisleGap`, la posición que corresponde a una fila de 16) y **no se deriva** de la semianchura de cada fila. Las filas 14 (15 butacas), 15 (14 butacas) y 16 (sin bloque central) tienen el centro más angosto; derivarlo de ahí correría el ala hacia adentro y torcería una columna que en el plano está recta. `geometry.aisleGap` ya no lo lee ninguna función: queda en el plano como el dato que explica esa cuenta, y el test de `lib/plans/` la verifica.

### Interacción y accesibilidad

Requisitos del spec, no adornos:

- Cada butaca es un `role="button"` dentro del SVG, con `aria-label` completo ("Fila 7, butaca 12, Platea B, 38.000 pesos, disponible").
- **Roving `tabindex`**: la Platea entera es *una sola* parada de tabulación. Flechas mueven entre butacas (`nextSeatId`), Enter/Espacio alterna. Mover el foco lógico no mueve el foco del DOM por sí solo: `useSeatPicker` lo hace explícitamente con un `pendingFocus` ref + `useEffect` que busca por `data-seat-id` con `CSS.escape`.
- Las ocupadas son `aria-disabled` y no responden al click.
- Región `aria-live="polite"` en `SelectionPanel` que anuncia selección y total.
- **Ningún estado se comunica sólo por color**: la seleccionada cambia de relleno *y* aparece en la lista del panel.
- Monocromático: el sector se distingue por posición y etiqueta, nunca por color.

## Checkout con Mercado Pago

El pago vive en los bordes: `utils/mercadopago/` (preferencia y consulta de pagos), `app/api/mercadopago/webhook/` (notificaciones), `utils/orders.ts` (lectura del resumen) y `supabase/migrations/0002_orders.sql` (el esquema y las funciones). Tres decisiones que hay que conocer antes de tocar algo:

- **Toda escritura sobre `reservations` y `orders` pasa por las funciones `security definer`.** Las policies de RLS de escritura directa fueron revocadas a propósito: si el cliente pudiera hacer `insert`/`update` por su cuenta, podría reservar butacas sin orden, cambiar el precio o marcarse una orden como `confirmed`. `create_order_with_reservations`, `cancel_own_order` y `set_order_status` son la única puerta, y cada una valida adentro lo que el cliente no puede validar. No agregues una policy de escritura para "arreglar" un `permission denied`: falta un argumento o una función, no una policy.
- **El hold de 20 minutos está definido en cinco lugares y tienen que coincidir**: `HOLD_MINUTES` en `utils/mercadopago/client.ts` (arma el `expiration_date_to` de la preferencia), los de `create_order`, `admin_block_seats` y `active_reservation_seats` en `0008_performances.sql`, y el de `admin_cancel_order` en `0005_seat_blocks.sql`. **Ojo**: hay copias viejas que ya no corren. `0002_orders.sql` tiene `create_order` y `active_reservation_seats`, `0005_seat_blocks.sql` tiene `admin_block_seats` y `active_reservation_seats`, y `0006_seat_id_wings.sql` tiene `create_order` y `admin_block_seats`, pero las reemplazan migraciones posteriores. Editar ahí no cambia nada. No hay forma de derivar uno del otro: el SQL corre sin el bundle de TS y la preferencia se arma sin consultar la base. Si cambia el hold, se cambian los cinco que sí corren.
- **El `check` del `seat_id` es específico del Teatro del Globo** (`<sector>-F<fila>-<número>`, donde el sector puede llevar guiones, como `platea-ala-izq`; vive en `create_order` y `admin_block_seats` de `0008_performances.sql`) y contradice el "otra sala es otro `VenuePlan`, no código nuevo" de arriba. Se aceptó igual porque es la única defensa de la base contra un `seat_id` inventado, y la alternativa —una tabla de butacas poblada desde el `VenuePlan`— es trabajo que todavía no hace falta. Cuando aparezca la segunda sala, ese `check` se reemplaza por esa tabla; no se le agregan sectores a mano.
- **El `external_reference` de un pago se valida como UUID antes de llegar al RPC.** `set_order_status` recibe un `uuid`, así que una referencia con otra forma —un pago de prueba hecho desde el panel de Mercado Pago, un link reusado de otra integración— haría fallar a Postgres con `22P02` para siempre. Ese caso es un no-op con 200; el 5xx queda reservado para fallas realmente transitorias, que son las que conviene que Mercado Pago reintente.

## Envío de la entrada por mail

Cuando Mercado Pago aprueba un pago, el webhook manda un mail al comprador con la entrada adjunta. Igual que el checkout, vive en los bordes: `lib/tickets/message.ts` (puro: arma asunto y cuerpo), `utils/email/client.ts` (Brevo), `utils/tickets/attachment.ts` (arma el PDF) y `utils/tickets/deliver.ts` (orquesta). Variables: `BREVO_API_KEY`, `TICKET_FROM_EMAIL` y `TICKET_FROM_NAME`.

- **La entrega se reclama antes de mandar.** Mercado Pago reintenta las notificaciones y `set_order_status` es idempotente, pero el mail no: sin reclamo llegan dos. `claim_ticket_delivery` hace `update ... set ticket_sent_at = now() where ticket_sent_at is null and status = 'confirmed'` y devuelve si ganó la carrera; sólo el que gana manda. Si el envío falla, `release_ticket_delivery` devuelve la orden a la cola.
- **Un mail que falla nunca devuelve 5xx.** El webhook responde 200 igual: el 5xx le dice a Mercado Pago que reintente *el cobro*, no el correo. La orden queda con `ticket_sent_at` en `null` y se puede reenviar.
- **El adjunto es el PDF de la orden.** `buildTicketAttachment(performance, seatIds)` lo arma con el fondo de la función y la fila y el asiento de cada butaca; ver "La entrada en PDF". `sendTicketEmail` recibe `{ name, contentBase64 }` y no sabe de formatos.
- **La obra es una constante; las funciones son una tabla.** `lib/show.ts` guarda obra, sala y dirección. La fecha sale de la función de la orden: `buildTicketEmail` la recibe y la escribe con `formatPerformanceDate`. Ver "Funciones".
- El proveedor de mail está detrás de un único módulo a propósito: pasar de Brevo a Resend cuando el teatro tenga dominio propio es tocar `utils/email/client.ts` y nada más.

## Funciones

La obra tiene varias funciones (fechas). Después del login, `/` lista las que están a la venta (`PerformanceList`) y cada una abre su selector en `/funciones/[performanceId]`. El dominio puro está en `lib/performance.ts`, las lecturas en `utils/performances.ts` y el esquema en `supabase/migrations/0008_performances.sql`.

- **Las funciones son filas de `performances`, no código.** `id uuid` y `starts_at timestamptz` único. Se cargan y se editan desde el SQL Editor de Supabase, siempre con la zona: `insert into performances (starts_at) values ('2026-12-12 21:00:00-03');`. El Table Editor toma la hora en UTC si no se aclara y la función queda tres horas antes. No hay pantalla para cargarlas.
- **Todo lo vendible es por función.** `orders.performance_id` y `reservations.performance_id` son `not null` y apuntan a `performances`: la clave foránea impide borrar una función con ventas. El índice único parcial es `(performance_id, seat_id)`, así que la misma butaca se vende una vez por función, y los bloqueos del admin también son por función.
- **La venta se corta a la hora de inicio, en dos lugares a propósito.** `createOrder` lee la función y responde "Esta función ya no está a la venta." sin tocar la base; `create_order` vuelve a controlar `starts_at > now()` adentro, que es la defensa real. La lista y la ruta del selector esconden las funciones que empezaron; el admin las sigue mostrando.
- **El id de la función se valida como UUID antes de consultar** (`isPerformanceId`), igual que el `external_reference` del webhook: un id con otra forma haría fallar a Postgres con `22P02`. `fetchPerformance` devuelve `null` sin consultar.
- **Las fechas no usan los nombres de `Intl`.** `performanceParts` saca las cifras de `Intl.DateTimeFormat` con la zona de Argentina, pero los días y los meses salen de tablas propias: los textos de `Intl` cambian entre Node y el navegador ("sáb." contra "sáb") y eso rompe la hidratación del selector. Todas las pantallas y el mail escriben la fecha con `formatPerformanceDate` ("Sábado 5 de diciembre · 21 h") o `formatPerformanceShort` ("Sáb 5").
- **La flecha atrás reemplaza al logo en el selector.** `BackToPerformances` es un link a `/`; con butacas elegidas frena la navegación y abre un `<dialog>` modal que avisa que se pierde la selección. El "atrás" del navegador no pasa por ese aviso. El `<dialog>` y su ref viven en ese componente para que `PlateaPicker` siga siendo sólo layout. jsdom no implementa `showModal`: `vitest.setup.ts` tiene un polyfill mínimo.
- **El join embebido necesita `as unknown as`.** `PERFORMANCE_EMBED` (`performance:performances(id, starts_at)`) trae la función en la misma consulta que la orden. Sin tipos generados de la base, supabase-js infiere un array para el embebido; PostgREST devuelve un objeto porque la relación es de muchos a uno.
- **En el admin, la función elegida va en la URL** (`/admin?funcion=<id>`). Sin parámetro válido, `defaultPerformance` elige la próxima a la venta o, si ya pasaron todas, la última. `AdminSeatMap` se remonta con `key={performance.id}` para que la selección no pase de una función a otra.

## Mis entradas

`/mis-entradas` lista las órdenes `confirmed` del usuario logueado, una tarjeta por orden, con la obra, las butacas y el total. No hay historial ni estados intermedios: una orden `pending` no tiene entrada que mostrar todavía y una `cancelled` no tiene entrada que mostrar nunca. `fetchMyOrders` (`utils/tickets/myOrders.ts`) trae las órdenes confirmadas y cruza sus reservas confirmadas; una orden sin reservas confirmadas queda afuera de la lista, aunque en la práctica no debería pasar.

- **No hay SQL nuevo.** Las policies `select propia orden` y `select propia reserva completa` que ya existían para el checkout alcanzan para esta pantalla: filtran por `user_id` adentro de la policy, así que `fetchMyOrders` y `fetchOwnPaidOrder` (`utils/tickets/ownOrder.ts`) no agregan `.eq('user_id', ...)` en la query. Agregar ese filtro en el código sería duplicar en dos lugares la misma regla, y el día que se desincronicen gana la policy igual.
- **`fetchOwnPaidOrder` es la única puerta de autorización de la descarga y del reenvío.** Pide la orden por `id`, exige `status = 'confirmed'` y trae sus reservas confirmadas; si algo de eso falla devuelve `null`. La ruta de descarga (`app/api/entradas/[orderId]/route.ts`) y la de reenvío (`app/mis-entradas/actions.ts`, server action `resendTicket`) tratan ese `null` igual que cualquier otro fallo: 404 con el mismo mensaje genérico, sin distinguir entre "no existe", "es de otro usuario" o "todavía no está pagada". Esa indistinción es a propósito: si el mensaje cambiara según el motivo, alguien podría usarlo para sondear ids de órdenes ajenas.
- **El reenvío no pasa por `claim_ticket_delivery`.** Ese reclamo existe para el webhook, donde Mercado Pago reintenta la notificación y hay que mandar el mail una sola vez. Acá el pedido es explícito: el usuario aprieta "Reenviar al mail" porque quiere el mail de nuevo, y repetirlo es el punto. El único tope es del lado del cliente, en `TicketCard` (60 segundos de cooldown tras un envío exitoso); no hay tope del lado del servidor todavía.
- **La descarga y el mail comparten `buildTicketAttachment`.** La ruta de descarga la usa para devolver el PDF como respuesta HTTP y `resendTicket` la usa para armar el adjunto del mail. Las dos le pasan la función y las butacas de la orden, así que el archivo que se baja y el que llega por mail son el mismo.
- **La pantalla no sabe de mails, sólo de sesión.** Si el usuario entra con una cuenta que no tiene compras, o con una cuenta distinta a la que compró, ve el estado vacío: no hay forma de recuperar compras por mail o por número de orden sin sesión, y quedó fuera de alcance a propósito. La única vía es iniciar sesión con la cuenta que compró.

## La entrada en PDF

La entrada es un PDF por orden con una página por butaca: el diseño de la función de fondo, con la fila y el asiento escritos debajo de sus etiquetas. `lib/tickets/layout.ts` (puro) calcula las posiciones, `utils/tickets/ticketPdf.ts` dibuja con `pdf-lib` y `utils/tickets/attachment.ts` lee los archivos y arma el adjunto. El spec es `docs/superpowers/specs/2026-10-05-entrada-pdf-design.md`.

- **El fondo de cada función se llama como su fecha.** `assets/tickets/2026-12-05.jpg` es la del sábado 5 de diciembre: `performanceDateKey` saca la fecha de `starts_at` en hora de Argentina. Sumar una función es cargar la fila en `performances` y agregar su imagen con ese nombre. Sin imagen, el mail no sale (la orden queda con `ticket_sent_at` en `null`) y la descarga da 404. Si alguna vez hay dos funciones el mismo día, el nombre necesita la hora.
- **Los fondos no van en `public/`.** Desde ahí se bajan por URL sin comprar. La entrada no tiene validación en la puerta, así que esto no la vuelve infalsificable: sólo evita servir el molde en blanco.
- **Las medidas de `layout.ts` salen de la imagen de 2160×820.** La columna derecha está centrada en x = 2013 y las líneas de FILA y ASIENTO están en y = 403 y 596. Un diseño que mueva esa columna obliga a remedir; uno que sólo cambie la fecha o la foto, no. El estilo copia la entrada de la función anterior: negrita, naranja `#BD633E`, 0,12 em de espaciado, 20 px debajo de la línea. Debajo de PLATEA no va nada.
- **Fila y número alcanzan porque no se repiten en la sala.** Las alas continúan la numeración del centro de su fila. `lib/tickets/__tests__/seats.test.ts` lo verifica sobre todo el plano: si un cambio del plano lo rompe, la entrada necesita mostrar el sector.
- **La fuente es provisoria:** Barlow SemiBold (OFL, con su licencia en `assets/fonts/OFL.txt`). Cuando llegue la del diseño se reemplaza el archivo y `FONT_PATH` en `attachment.ts`. El tamaño sale de la altura de mayúsculas de la fuente, así que la posición no se remide.
- **`next.config.ts` suma `assets/**` a las tres rutas que arman la entrada.** El servidor lee esos archivos con `fs` y la ruta del fondo se arma con la fecha, así que el trazado automático de Next no los encuentra y en el deploy faltarían.
- **Los tests que arman un PDF corren en entorno node** (`// @vitest-environment node`, la única línea de comentario admitida): bajo jsdom, `pdf-lib` rechaza el `Buffer` que devuelve `fs`.

## Panel de administración y vinculación de Mercado Pago

`/admin` se abre con una contraseña (`ADMIN_PASSWORD`) y de ahí en más sostiene una cookie
firmada de 8 horas. La firma es `lib/admin/session.ts` (puro: recibe el secreto y el `now`
por parámetro); el gate vive en `middleware.ts`, que cubre también los route handlers del
OAuth porque cuelgan de `/admin/`.

- **La cuenta de Mercado Pago del cliente se vincula por OAuth, y es la única fuente del
  access token.** `MP_ACCESS_TOKEN` ya no existe: `utils/mercadopago/account.ts` es el único
  lugar que resuelve un token, y sin cuenta vinculada `createOrder` no crea la orden y el
  webhook responde 200 sin hacer nada. Un fallback al `.env` significaría plata cayendo en la
  cuenta equivocada sin que nadie se entere.
- **La tabla `mercadopago_account` tiene una sola fila** (`id boolean primary key default true
  check (id)`), con RLS habilitado y **sin ninguna policy**. A diferencia de `orders` no hace
  falta una función `security definer`: el browser nunca la escribe, sólo el callback de OAuth,
  que ya está detrás del gate de admin. Los tokens se guardan en claro; es el mismo nivel de
  exposición que tenía `MP_ACCESS_TOKEN` en el `.env`.
- **El access token se refresca preventivamente con 5 minutos de margen**, no al vencer.
  El `refresh_token` de Mercado Pago dura ~180 días: si el sitio queda mucho tiempo sin vender,
  hay que volver a vincular, y el panel lo muestra como desconectada.
- **El `state` del OAuth se firma con la misma clave HMAC que la sesión pero con un propósito
  distinto** (`createSessionToken`/`verifySessionToken` toman `'session'` u `'oauth'` como
  parámetro y el payload firmado lleva ese prefijo), y vence a los 10 minutos, además de
  cotejarse contra una cookie. Un token de sesión no verifica como `state` ni viceversa: sin
  esa separación, el `state` —que viaja en una URL que Mercado Pago loguea y que queda en el
  historial del navegador— sería una cookie de sesión válida disfrazada. No hay PKCE: es un
  cliente confidencial y el `client_secret` nunca sale del servidor.
- La `redirect_uri` es `${SITE_URL}/admin/mercadopago/callback` y tiene que estar registrada en
  la aplicación de Mercado Pago. MP exige **https**: en `localhost` el callback no funciona, se
  prueba con un túnel o en un deploy de preview. El `MP_WEBHOOK_SECRET` sigue siendo el de la
  aplicación, no el del cliente.

Variables: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `MP_CLIENT_ID`, `MP_CLIENT_SECRET`.

## Administración de butacas y órdenes

El mapa de `/admin` bloquea butacas para que no se vendan (invitados, prensa, butacas
rotas) y cancela órdenes liberando sus butacas. La lógica pura está en
`lib/admin/seatState.ts`, la máquina de estados en `hooks/useAdminMap.ts`, las lecturas
en `utils/admin/` y las escrituras son server actions en `app/admin/actions.ts`.

- **Un bloqueo es una fila de `reservations` con `status = 'blocked'`, sin usuario y sin
  orden.** No es una tabla aparte a propósito: el índice único parcial sobre `seat_id` es
  lo único que impide la doble venta, y Postgres no puede validar unicidad entre dos
  tablas. Metiendo `blocked` adentro de ese índice, la base impide bloquear una butaca
  vendida y vender una bloqueada sin una línea de código. El costo es que `user_id` dejó
  de ser `not null`; el check `(status = 'blocked') = (user_id is null)` lo compensa.
- **El selector público no sabe que existen los bloqueos.** `active_reservation_seats(p_performance_id)`
  los devuelve junto con las vendidas, así que una butaca bloqueada se ve igual que una
  vendida para el que compra. Esa función devuelve `(seat_id, status, order_id)`: la
  tercera columna es para el panel, el selector la ignora.
- **El panel no reembolsa.** Cancelar una orden cobrada libera las butacas y muestra el
  `mp_payment_id` para devolver a mano desde Mercado Pago. Integrar la API de refunds es
  un módulo nuevo con refunds parciales y fallidos, y un bug ahí se ve en la cuenta del
  cliente.
- **Un bloqueo no guarda motivo.** Ni categoría, ni nota, ni quién lo hizo. Cuando exista
  la lista para la puerta y haya dónde mostrarlo, se agrega con el caso de uso adelante.
- **Desbloquear borra la fila.** `admin_unblock_seats` hace `delete`, no `update ... set
  status = 'cancelled'`: el check `(status = 'blocked') = (user_id is null)` no admite una
  fila cancelada sin usuario, y un bloqueo sin motivo no deja historial que valga la pena
  guardar. La versión vigente es la de `0008_performances.sql`, que borra sólo dentro de la
  función; las de `0005_seat_blocks.sql` y `0007_unblock_deletes_block.sql` quedaron reemplazadas.
- **La selección del admin no tiene tope.** `MAX_SEATS` es una regla de venta, no de la
  sala: bloquear la fila de prensa son veinte butacas.
- **`SeatMap` y `SeatArc` no saben pintar una butaca.** Reciben un `renderSeat` y pintan
  el encuadre y la geometría. El selector público les pasa `SeatButton`; el panel le pasa
  `AdminSeatButton`, que tiene cinco estados y donde todas las butacas son clickeables
  porque una vendida abre su orden. El admin no arma su propio `<svg>`: el `viewBox` sale
  del Recinto y duplicarlo se desincroniza.
- **Una orden pendiente no se cancela mientras se puede pagar.** `admin_cancel_order` devuelve `0`
  para una orden `pending` creada hace menos de 20 minutos. Si se cancelara, un pago que entra
  después encuentra la orden cerrada y `set_order_status` no lo registra: se cobra y nadie se entera.
  Pasado el hold, Mercado Pago ya no acepta el pago de esa preferencia y cancelar es seguro.
- **`active_reservation_seats(p_performance_id)` le devuelve a cualquier usuario logueado el `order_id` y el estado
  `blocked`.** Se aceptó: los `order_id` son UUID sin uso posible desde el cliente (`cancel_own_order`
  exige ser el dueño), y separar una función para el panel sumaría otro literal del hold.
- **El panel son tres pestañas y cada una es una ruta** del route group `app/admin/(panel)/`:
  Butacas (`/admin`), Órdenes (`/admin/ordenes`) y Cuenta (`/admin/cuenta`). `/admin/login`
  queda fuera del grupo para no mostrar la barra, y `middleware.ts` no cambia porque las URLs
  no cambian. El callback de OAuth vuelve a `/admin/cuenta`.
- **La lista de órdenes trae las últimas 200 y filtra por mail en el cliente.** Los mails
  viven en `auth.users`, así que `fetchAdminOrders` los lee con `auth.admin.listUsers` y los
  cruza por `user_id`. Si esa lectura falla, las órdenes se muestran igual, sin mail.

## Estilo

**`DESIGN.md` es la fuente de verdad de todo lo visual**: tokens de color en claro y oscuro, escala tipográfica de Caveat y de JetBrains Mono, radios, espaciado, componentes, movimiento y qué se usa dónde. Leelo antes de escribir o cambiar clases, colores, tipografía o un componente en `components/` o `app/`. Si cambia `DESIGN.md`, `.impeccable/design.json` (su sidecar para Impeccable) se regenera con `/impeccable document`.

Tres cosas del código que `DESIGN.md` no cubre:

- **Un token mal escrito falla en silencio.** Tailwind v4 genera `stroke-paper` porque existe `--color-paper` en `@theme`; con un nombre que no existe no genera nada y no avisa. El nombre de cada token está en el frontmatter de `DESIGN.md` y en `app/globals.css`, donde `.dark` los redefine con el mismo nombre.
- **El color del papel está en tres lugares que no se derivan entre sí**: `--color-paper` en `app/globals.css`, `THEME_COLORS` en `lib/theme.ts`, y el `THEME_SCRIPT` y la `<meta name="theme-color">` de `app/layout.tsx`. Si cambia el papel, claro u oscuro, se cambian los tres.
- **El tema se aplica antes de pintar** con el script inline de `app/layout.tsx`, que lee `localStorage` y pone la clase `dark` en `<html>`. Sin ese script la página carga en claro y parpadea a oscuro. `ThemeToggle` lo cambia después a través de `lib/theme.ts` (`light` / `dark` / `system`).

## Git

- Un commit por unidad de trabajo. No se hace `push`: queda en manos del usuario.
- **Nunca `git add -A` ni `git add .`** — stagear por nombre. Hay cosas en el working tree que **no se commitean**: `plan.md`, `docs/` y `distribucion-asientos.png`. Verificar con `git status --short` antes de cada commit.
- **Toda feature o implementación nueva arranca en un worktree**, de entrada y sin que haga falta pedirlo: usá el skill `superpowers:using-git-worktrees` al planificar el trabajo, no sólo si el usuario lo menciona. El worktree deja una copia del repo en otra carpeta, sobre su propia rama, mientras `main` en el directorio principal queda libre para seguir usándose en paralelo. Se salta este paso sólo para cambios triviales (un typo, un ajuste de una línea) o si el usuario pide explícitamente trabajar directo sobre `main`.
