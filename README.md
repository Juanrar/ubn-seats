# ubn-seats

WebApp para comprar tickets del Teatro del Globo.

## Problemática

Este proyecto dibuja la Platea tal cual es (filas curvas, bloque central + alas, numeración real, tarifas por franja) para que la persona vea y elija exactamente la butaca que va a ocupar.

Es la **base de front** sobre la que después se suma lógica y contenido (otras salas, backend, checkout). Hoy no tiene backend, checkout ni persistencia: la ocupación es simulada.

## Cómo está armado

Pipeline pura en `lib/` (sin React) que arma el catálogo de butacas a partir de un `VenuePlan` (dato, no código), consumida por componentes que sólo pintan. El detalle completo de arquitectura, reglas y decisiones vive en `CLAUDE.md` y el glosario de dominio en `CONTEXT.md`.

## Comandos

```bash
npm run dev          # servidor de desarrollo
npm run build         # build de producción
npm run typecheck     # tsc --noEmit
npm test              # tests (watch)
npm run test:run       # tests una sola vez
```

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar con los valores del proyecto de Supabase (Settings → API en el dashboard): `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
