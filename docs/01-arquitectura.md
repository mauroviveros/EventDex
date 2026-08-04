# 01 — Arquitectura

## Stack decidido

| Capa | Elección |
|------|----------|
| App pública del evento | **Astro 5** (SSR, adapter Vercel) + islas React |
| Dashboard de administración | **Next.js 16** App Router + React 19 |
| Landing de marketing | **Astro 5** (estático) |
| Base de datos / Auth / Storage | **Supabase** (Postgres 15+, RLS, Auth OAuth) |
| Estilos | Tailwind v4 + shadcn/ui |
| Monorepo | **Turborepo + pnpm workspaces** |
| Lint / format | Biome |
| Tests | Vitest |
| Fechas | Luxon |

Ver [ADR-0001](./adr/0001-stack.md) para el análisis de las alternativas
(Next puro, TanStack Start, Angular).

### El tradeoff que hay que tener presente

Elegiste Astro para lo público y Next para el admin. Eso trae un costo concreto:
**la sesión de Supabase hay que resolverla en dos runtimes distintos**, con dos
implementaciones de manejo de cookies (`@supabase/ssr` tiene adaptador para ambos,
pero la integración es distinta).

Se mitiga así:

1. **`/raffle` se muda al admin.** Hoy vive en la app pública y es la única pantalla
   pública que requiere permisos de organizador. Moviéndola, **Astro solo necesita
   manejar sesión de visitante** (login con Google + leer `auth.uid()`), que es el
   caso simple. Toda la lógica de roles queda en un solo runtime.
2. **`packages/auth` centraliza el contrato.** Un solo módulo expone
   `getSession()` / `getUser()` con dos adaptadores finos (Astro `AstroCookies`,
   Next `cookies()`). La lógica de negocio no sabe en qué runtime corre.
3. **El callback de OAuth es uno solo**, en la app pública, y redirige por `next`
   param. No se duplica la config de Google.

Si en algún momento el costo se vuelve molesto, la salida es plegar la app pública
a Next (opción 1 del ADR): el dominio y los packages no cambian.

## Topología del monorepo

```
eventdex/
├── apps/
│   ├── web/          Astro · app pública del evento (multi-tenant por dominio)
│   ├── admin/        Next.js · dashboard de organización
│   └── landing/      Astro · marketing de Eventdex (eventdex.com)
├── packages/
│   ├── db/           Tipos generados de Supabase + enums + DTOs
│   ├── supabase/     Clientes (browser / server-astro / server-next / service)
│   ├── auth/         Sesión, roles y guards. Agnóstico de framework
│   ├── domain/       Lógica pura: fase del evento, elegibilidad de sorteo, resolución de spots
│   ├── ui/           Primitivas shadcn compartidas + tokens de diseño
│   └── config/       tsconfig, biome, tailwind preset compartidos
├── supabase/
│   ├── migrations/   Fuente de verdad del esquema
│   └── seed.sql
├── docs/
└── turbo.json
```

### Por qué monorepo con Turbo (y no "turbo *o* monorepo")

Vale aclarar la pregunta original: **Turborepo no es una alternativa a un monorepo,
es el orquestador de tareas de un monorepo**. `pnpm-workspace.yaml` es lo que hace
el monorepo; Turbo es lo que hace que `pnpm build` no rebuildee las 3 apps cuando
tocaste una sola.

Se mantiene porque:

- Un cambio de esquema toca `packages/db` y las 3 apps **en el mismo commit**. En
  repos separados serían 3 PRs y un release del paquete de tipos.
- La caché de Turbo (`--filter`, `--affected`) hace que CI corra solo lo tocado.
- Ya está configurado y funcionando.

### Reglas de dependencia entre packages

```
apps/*  →  ui, domain, auth, supabase, db, config
auth    →  supabase, db
domain  →  db                    (lógica pura, sin I/O, sin Supabase)
supabase→  db
db      →  (nada)
```

Regla dura: **`packages/domain` no importa Supabase ni React.** Es donde vive la
lógica testeable sin mocks (fase del evento, quién es elegible para el sorteo,
resolución de overrides de spots). Esto es lo que hace que las dos apps compartan
comportamiento sin compartir runtime.

### Qué se elimina de la v1

| Qué | Por qué |
|-----|---------|
| `apps/dashboard` | Iteración vieja, casi duplicada de `apps/admin`. Se borra, no se migra |
| `apps/event/.git` | Repo git anidado, resto de una extracción anterior |
| `events.config` (jsonb) | Nunca se usó; la config de marca pasa a `organizations.brand` |
| `EVENTDEX_EVENT_ID` | El evento se resuelve por calendario, no por variable de entorno |
| `EVENTDEX_ORGANIZATION_ID` | La organización se resuelve por dominio (`organization_domains`) |

## Multi-tenancy: cómo se resuelve la organización

La v1 fijaba la organización en una variable de entorno, lo que obliga a un
deployment por cliente. La v2 la resuelve por **host**:

```
request → Host: expoubbe.com
        → organization_domains.hostname = 'expoubbe.com'
        → organization_id
        → resolve_active_event(organization_id)  ← función SQL
        → render
```

Un solo deployment de `apps/web` sirve a todas las organizaciones. En desarrollo,
`PUBLIC_DEV_HOST` fuerza un hostname para no tener que tocar `/etc/hosts`.

El "cuál evento mostrar" (en curso → próximo → último terminado) deja de ser un
`.filter().sort()` en JavaScript sobre todos los eventos de la organización y pasa
a ser **una función SQL** (`resolve_active_event`), que devuelve un id. Ver
[05 — Flujos](./05-flujos.md#resolución-del-evento-activo).

## Variables de entorno

### `apps/web` (Astro)

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `PUBLIC_SUPABASE_URL` | ✅ | URL del proyecto |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Clave pública (respeta RLS) |
| `PUBLIC_DEV_HOST` | dev | Hostname a simular en desarrollo |
| `PUBLIC_ADMIN_URL` | — | Link al dashboard desde el menú |

Nota: **`apps/web` no lleva `SUPABASE_SERVICE_ROLE_KEY`.** Todo lo que necesita
leer está cubierto por políticas RLS para `anon` / `authenticated`. Si aparece la
necesidad de la service key en la app pública, es señal de que falta una política.

### `apps/admin` (Next)

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Clave pública |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Solo para tareas administrativas puntuales |
| `NEXT_PUBLIC_SITE_URL` | — | Para construir las URLs de los QR |

La service key queda como excepción documentada, no como default. En v1 era al
revés. Ver [04 — RLS](./04-rls.md#cuándo-sí-usar-la-service-key).
