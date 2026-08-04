# ADR-0001 — Stack: Astro para lo público, Next para el dashboard

- **Estado:** Aceptado (2026-08-03)
- **Decide:** Mauro

## Contexto

El circuito de Eventdex tiene dos naturalezas muy distintas conviviendo:

| Superficie | Naturaleza | Peso SEO |
|------------|-----------|----------|
| Landing del evento | Contenido, countdown, casi estática | Alto |
| `/s/[id]` reclamo de medalla | Auth + una escritura | Nulo (detrás de QR) |
| `/perfil` | Datos del usuario logueado | Nulo |
| Dashboard completo | Tablas, filtros, charts, formularios | Nulo |
| Landing de marketing | Contenido puro | Alto |

Medido en pantallas, la app es mayoritariamente interactiva y autenticada.
Medido en visitas, la landing del evento se lleva casi todo el tráfico: es la
página que ve cada asistente y la que tiene que cargar rápido en el 4G saturado
de un predio lleno de gente.

## Decisión

- **`apps/web` (público del evento): Astro 5** con SSR e islas React.
- **`apps/admin` (dashboard): Next.js 16** App Router.
- **`apps/landing` (marketing): Astro 5** estático.

## Alternativas consideradas

### Next.js para todo

Lo que había en v1. Un solo runtime, una sola implementación de auth Supabase, y
RSC + Server Actions encajan bien con el modelo de datos.

Descartada porque el peso de JavaScript de la landing del evento —la página de
mayor tráfico y peores condiciones de red— es difícil de bajar del piso de React
+ hidratación, y Astro lo lleva prácticamente a cero.

Vale registrar que en la v1 esta misma comparación se había resuelto al revés
(está anotado: *"NO migrar a Astro, superficie SEO = 1 página"*). El criterio
cambió: no es solo SEO, es tiempo de carga en condiciones adversas.

### TanStack Start para todo

Router type-safe end-to-end y TanStack Query/Table nativos, que le calzarían muy
bien al dashboard (que ya usa `@tanstack/react-table`).

Descartada por madurez: la integración con `@supabase/ssr` está mucho menos
rodada, y el deploy en Vercel no tiene el mismo nivel de afinado.

### Angular

Descartada. Implicaría reescribir el 100% de la interfaz —se pierde todo shadcn/ui,
que es de donde sale la velocidad de iteración actual— y el SSR para la landing
pública es más costoso de afinar que RSC o Astro.

## Consecuencias

### Positivas

- Landing del evento con JS mínimo: mejor Core Web Vitals donde más importa.
- El dashboard se queda donde Next es más fuerte (formularios, mutaciones, RSC).
- Astro islands permite que las partes interactivas (countdown, botón de reclamo)
  sigan siendo componentes React reutilizables desde `packages/ui`.

### Negativas — y cómo se mitigan

**El costo principal: la sesión de Supabase en dos runtimes.**

| Mitigación | Detalle |
|------------|---------|
| Mover `/raffle` al admin | Es la única pantalla pública con permisos de organizador. Sin ella, Astro solo maneja sesión de visitante |
| `packages/auth` | Un contrato, dos adaptadores finos de cookies. La lógica de negocio no sabe en qué runtime corre |
| `packages/domain` puro | Toda la lógica compartida vive fuera de ambos frameworks |

Otras negativas:

- Dos sistemas de build y dos configuraciones de Tailwind (mitigado con
  `packages/config`).
- Los componentes de `packages/ui` tienen que funcionar como islas: sin
  dependencias de contexto de Next (`next/navigation`, `next/link`).

### Salida si el costo se vuelve molesto

Plegar `apps/web` a Next. El modelo de datos, los packages y el dominio no
cambian; solo se reescribe la capa de rutas. Es una tarde de trabajo, no un
rediseño.
