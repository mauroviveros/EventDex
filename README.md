# Eventdex v2

Plataforma de eventos multi-tenant: cada organización sirve su app pública desde su
propio dominio, contra un solo deployment.

El diseño completo vive en [`docs/`](./docs) — empezar por
[00 — Visión](./docs/00-vision.md) y [01 — Arquitectura](./docs/01-arquitectura.md).

## Estructura

```
eventdex/
├── apps/
│   ├── web/          Astro SSR · app pública del evento (multi-tenant por Host)
│   ├── admin/        Next.js · dashboard de organización
│   └── landing/      Astro estático · marketing (eventdex.com)
├── packages/
│   └── config/       tsconfig, biome y preset de Tailwind compartidos
├── docs/             Diseño, modelo de datos, RLS, roadmap y SQL
└── turbo.json        Pipeline de tareas
```

Los packages `db`, `supabase`, `auth`, `domain` y `ui` llegan en la fase 3
(ver [06 — Roadmap](./docs/06-roadmap.md)).

## Stack

| Capa | Elección |
|------|----------|
| App pública | Astro 5 (SSR, adapter Vercel) + islas React |
| Dashboard | Next.js 16 App Router + React 19 |
| Landing | Astro 5 (estático) |
| Base de datos / Auth | Supabase (Postgres, RLS, OAuth) |
| Estilos | Tailwind v4 + shadcn/ui |
| Monorepo | Turborepo + pnpm workspaces |
| Lint / format | Biome |
| Tests | Vitest |

## Requisitos

- Node >= 22.12
- pnpm 11 (`corepack enable`)

## Comandos

Todos desde la raíz; turbo los reparte entre las apps.

```bash
pnpm install
```

```bash
pnpm dev
```

```bash
pnpm build
```

```bash
pnpm lint && pnpm check-types
```

`pnpm format` aplica los fixes de Biome. Para trabajar sobre una sola app:

```bash
pnpm --filter @eventdex/web dev
```

## Convenciones

- **Lint y formato**: Biome en todo el repo. Biome no parsea `.astro`, así que el
  markup de las apps Astro queda cubierto por `astro check` (que es lo que corre
  `check-types` ahí).
- **tsconfig**: las tres apps extienden de `@eventdex/config/tsconfig/*`.
- **Tokens de diseño**: `@eventdex/config/tailwind.css`. Los tokens `--brand-*`
  son la indirección que va a pisar `organizations.brand` por tenant.
- **Commits**: `<type>(<scope>): :gitmoji: <mensaje>`.
