# Plan de continuación — Eventdex v2

## Context

La branch `refactor/v2` ya tiene el diseño cerrado (`docs/`, commits `276788b` y
`066b430`) y las tres apps scaffoldeadas (`52f06e1` … `8514cfb`). Pero los
scaffolds son **salida cruda de `create-astro` / `create-next-app`**: nada está
conectado entre sí, y hay un defecto que rompe el monorepo de raíz.

El objetivo de esta etapa es dejar el monorepo **funcionando como monorepo**
—turbo orquestando, apps consumiendo `packages/*`, tooling unificado— para recién
después aplicar el esquema en Supabase y escribir el núcleo compartido.

Decisiones tomadas para esta etapa: **Biome en todo el repo** (se saca ESLint) y
**sanear el scaffold antes que el esquema**.

---

## Estado actual

| Bloque | Estado |
|--------|--------|
| Diseño (`docs/`) | ✅ Commiteado |
| Turborepo + workspace | 🔸 Existe, `turbo.json` con `tasks: {}` vacío |
| `apps/web` (Astro) | 🔸 Scaffold crudo, sin adapter SSR ni React |
| `apps/landing` (Astro) | 🔸 Scaffold crudo |
| `apps/admin` (Next) | 🔸 Scaffold crudo + **workspace anidado** |
| `packages/` | ⛔ Vacío |
| Proyecto Supabase v2 | ⛔ No creado |

### Defectos concretos a corregir

1. **`apps/admin/pnpm-workspace.yaml` + `apps/admin/pnpm-lock.yaml`** — pnpm trata
   a `apps/admin` como raíz de su propio workspace. Mientras existan, `workspace:*`
   no resuelve y la app **no puede consumir `packages/*`**. Es el bloqueante real.
2. **`turbo.json` con `tasks: {}`** — turbo no orquesta nada; `turbo run build` no
   hace nada.
3. **`apps/admin` se llama `admin`**, no `@eventdex/admin` (web y landing sí siguen
   la convención).
4. **`packageManager` repetido** en los tres `package.json` de apps; solo va en la raíz.
5. **Tooling divergente** — admin trae ESLint, las Astro no tienen linter, ninguna
   tiene `check-types` ni `test`.
6. **`apps/web` sin adapter SSR** — `astro.config.mjs` está vacío, pero la
   resolución multi-tenant por `Host` (ver `docs/05-flujos.md`) **exige SSR**.
7. **Sobras de los scaffolders** — `AGENTS.md`, `CLAUDE.md`, `README.md` y `.vscode`
   duplicados por app.
8. **3 referencias obsoletas en docs** — `app.platform_visitor_stats()` quedó con el
   prefijo viejo; la función vive en `public.` (`docs/02-roles-y-permisos.md:70`,
   `docs/03-modelo-de-datos.md:370`, `docs/sql/007_functions_and_views.sql:192`).

---

## Fase 1 — Sanear el monorepo

### 1.1 Arreglar el workspace

- Borrar `apps/admin/pnpm-workspace.yaml` y `apps/admin/pnpm-lock.yaml`.
- Mover su `allowBuilds` (`sharp: false`, `unrs-resolver: false`) al
  `pnpm-workspace.yaml` de la raíz.
- Renombrar el paquete a `@eventdex/admin` y alinear `description` / `author` /
  `version` / `engines` con `apps/web` y `apps/landing`.
- Sacar `packageManager` de los tres `package.json` de apps.
- `pnpm install` desde la raíz para regenerar un único `pnpm-lock.yaml`.

### 1.2 `turbo.json` con pipeline real

Tareas `build` (`dependsOn: ["^build"]`, outputs `.next/**`, `dist/**`, `!.next/cache/**`),
`dev` (`cache: false`, `persistent: true`), `lint`, `check-types`, `test`.
Sin `globalEnv` de v1 (`EVENTDEX_EVENT_ID` y `EVENTDEX_ORGANIZATION_ID` ya no existen:
la organización se resuelve por dominio).

Scripts en la raíz: `dev`, `build`, `lint`, `format`, `check-types`, `test`, todos
vía `turbo run`.

### 1.3 `packages/config`

Primer paquete, del que dependen todos los demás:

- `tsconfig/base.json`, `tsconfig/astro.json`, `tsconfig/next.json`
- `biome.json` — configuración compartida
- `tailwind.css` — preset de tokens v4 compartido

Los `tsconfig.json` de las tres apps pasan a extender de acá. El de `apps/web`
hoy extiende `astro/tsconfigs/strict`; se conserva ese rigor en la base.

### 1.4 Unificar en Biome

- Quitar `eslint`, `eslint-config-next` y `apps/admin/eslint.config.mjs`.
- Agregar `@biomejs/biome` como devDependency de la raíz.
- Cada app: `biome.json` de una línea extendiendo `packages/config`.
- Agregar `lint`, `format` y `check-types` a los tres `package.json`.

> Nota: Biome no parsea `.astro`. El lint cubre `.ts` / `.tsx` (que es donde vive
> la lógica y las islas); el markup `.astro` queda cubierto por `astro check`,
> que es lo que corre `check-types` en esas apps.

### 1.5 Runtime de las apps Astro

`apps/web` — necesita SSR porque resuelve la organización por `Host`:

- `@astrojs/vercel` + `output: 'server'`
- `@astrojs/react` para las islas (countdown, botón de reclamo)
- Tailwind v4 vía plugin de Vite
- `site` y `PUBLIC_DEV_HOST` en la config

`apps/landing` — queda **estática** (`output: 'static'`), solo Tailwind. No
necesita React ni adapter.

### 1.6 Limpieza

Borrar `AGENTS.md`, `CLAUDE.md`, `README.md` y `.vscode/` de cada app (quedan los
de la raíz). Un solo `README.md` en la raíz describiendo la estructura v2.

**Commits sugeridos** (formato del repo: `<type>(<scope>): :gitmoji: <mensaje>`):

```
fix(admin): :bug: remove nested pnpm workspace breaking package linking
chore: :wrench: configure turbo task pipeline
chore(config): :package: add shared tsconfig, biome and tailwind preset
chore: :rotating_light: unify linting on biome, drop eslint
feat(web): :sparkles: enable ssr, react islands and tailwind
chore: :fire: remove scaffolder leftovers
docs: :pencil2: fix stale platform_visitor_stats references
```

---

## Fase 2 — Esquema en Supabase

Requiere tu cuenta para dos pasos (no los puedo hacer yo): **crear el proyecto** y
**configurar el OAuth de Google**.

1. Proyecto Supabase nuevo y vacío. El de v1 no se toca — queda de respaldo hasta
   que la v2 esté verificada en producción.
2. `supabase init` en la raíz; copiar `docs/sql/001` … `008` a
   `supabase/migrations/` con timestamp, y `009` a `supabase/seed.sql`.
3. `supabase db reset` y verificar con las queries de `docs/sql/README.md`
   (RLS activo en todas las tablas, ninguna tabla con RLS y sin políticas).
4. Configurar Google OAuth con las URLs de callback.
5. Generar tipos → `packages/db`.
6. Tests pgTAP del checklist de `docs/04-rls.md`.

Los dos puntos que ya están documentados y no hay que re-descubrir: la recursión de
políticas (por eso existe `app.event_phase()`) y que los grants de columna no
sirven para separar roles en Supabase.

---

## Fase 3 — Packages núcleo

- `packages/db` — tipos generados + enums + DTOs
- `packages/supabase` — clientes: `browser`, `server-astro`, `server-next`, `service`
- `packages/auth` — sesión y guards, un adaptador de cookies por runtime
- `packages/domain` — **puro, sin I/O, sin React**: fase del evento, resolución de
  overrides de spots, elegibilidad de sorteo. Con tests Vitest
- `packages/ui` — tokens + primitivas shadcn. Los componentes tienen que funcionar
  como islas de Astro: sin `next/navigation` ni `next/link`

---

## Fases 4-7

Sin cambios respecto de `docs/06-roadmap.md`:

- **4** `apps/web`: middleware host→org→evento, `/`, `/s/[id]`, `/perfil`, callback, SEO
- **5** `apps/admin`: **empezar por `/login` y `/denied`** (en v1 no existían y el
  guard redirigía a un 404), luego eventos, catálogo de spots, QR, métricas, sorteo
- **6** `apps/landing`
- **7** Panel de plataforma: cross-org read-only, facturación, audit log

---

## Decisiones abiertas

| Tema | Cuándo bloquea | Recomendación |
|------|----------------|---------------|
| **Dominio del admin** | Fase 2 (config OAuth) | Si el admin va a `admin.eventdex.com` y el público a dominios de cliente, no comparten dominio padre → un callback por app (dos URLs en la consola de Google). Más simple de operar |
| **Revisión del modelo de datos** | Fase 2 | Sigue abierta desde el diseño. Es el momento barato para cambiar tablas |
| **`points` en spots** | Fase 5 | Dejar en `1` si no se usa; no molesta |
| **Deploy target** | Fase 1.5 | Se asume **Vercel** (v1 lo usaba). Si cambia, cambia el adapter de Astro |

---

## Verificación

Al cerrar la Fase 1, esto tiene que pasar desde la raíz:

```bash
pnpm install                 # un solo lock, sin workspace anidado
pnpm build                   # turbo buildea las 3 apps
pnpm lint && pnpm check-types
pnpm dev                     # las 3 levantan en paralelo
```

Chequeos puntuales:

- `pnpm why @eventdex/config` desde `apps/admin` resuelve por `workspace:*`
  (falla hoy por el workspace anidado — es la prueba de que 1.1 funcionó).
- `find . -name pnpm-workspace.yaml -not -path "*/node_modules/*"` devuelve **una**
  sola línea.
- `apps/web` responde con `Host` distinto sin rebuild (SSR activo).
- `apps/landing` genera HTML estático en `dist/`.

Al cerrar la Fase 2, las queries de verificación de `docs/sql/README.md` y el
checklist de permisos de `docs/04-rls.md`.
