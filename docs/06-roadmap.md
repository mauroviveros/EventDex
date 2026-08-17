# 06 — Roadmap

Orden de trabajo. Cada fase cierra con un commit propio (formato
`<type>:<gitmoji> <message>`, en inglés) y un resumen de qué cambió y por qué,
antes de pasar a la siguiente.

---

## Fase 0 — Cimientos ✅ (en curso)

- [x] Branch `v2` con el contenido eliminado
- [x] `docs/` con el diseño completo
- [x] Decidido: **proyecto Supabase limpio, sin migrar datos de v1** (2026-08-03)
- [ ] **Revisión tuya del modelo de datos y de la matriz de permisos**

> Esta es la fase que más importa. Discutir una tabla en markdown cuesta cero;
> discutirla con datos productivos cuesta una migración.

**Commit:** `docs:📝 add v2 architecture and data model design`

---

## Fase 1 — Esqueleto del monorepo

- [x] `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.editorconfig`
- [x] `packages/config` — tsconfig, biome y preset de Tailwind compartidos
- [ ] `packages/db` — placeholder de tipos (se hace en la fase 3, con los tipos
      ya generados; un placeholder ahora no aporta nada)
- [x] `apps/web` (Astro), `apps/admin` (Next), `apps/landing` (Astro) — scaffolds
      que compilan y no hacen nada
- [ ] CI: lint + types + build con `turbo --affected`

**Commit:** `chore:🎉 scaffold v2 monorepo`

---

## Fase 2 — Esquema en Supabase

**Sin stack local.** Se descartó levantar Supabase con Docker: se trabaja
directo contra el proyecto hosteado. Ver
[el tradeoff y cómo se compensa](./sql/README.md#sin-db-reset-qué-se-pierde-y-cómo-se-compensa).

- [x] Migraciones escritas en `supabase/migrations/` (001…008)
- [ ] Proyecto Supabase nuevo, vacío. El de v1 no se toca: queda como respaldo
      de consulta hasta que la v2 esté en producción
- [ ] `pnpm db:link` contra el proyecto nuevo
- [ ] Configurar el proveedor OAuth (Google) en el proyecto nuevo
- [ ] `pnpm db:push` y verificar con `supabase/tests/verify.sql`
- [ ] Crear los dos usuarios de prueba y correr `supabase/seed.sql`
- [ ] `pnpm db:types` → `packages/db`
- [ ] Tests de permisos del checklist de [04](./04-rls.md#cómo-se-prueba)

**Commit:** `feat:🗃️ add v2 database schema with RLS`

---

## Fase 3 — Núcleo compartido

- [ ] `packages/supabase` — clientes browser / astro / next / service
- [ ] `packages/auth` — sesión y guards, un adaptador por runtime
- [ ] `packages/domain` — fase del evento, resolución de spots, elegibilidad de
      sorteo. **Puro, sin I/O, con tests**
- [ ] `packages/ui` — tokens + primitivas shadcn compartidas

**Commit:** `feat:📦 add shared packages (supabase, auth, domain, ui)`

---

## Fase 4 — App pública (`apps/web`)

- [ ] Middleware: host → organización → evento activo
- [ ] `/` landing con countdown
- [ ] `/s/[id]` reclamo de medalla
- [ ] `/perfil` progreso del visitante
- [ ] Auth callback
- [ ] SEO: metadata dinámica, JSON-LD `Event`, sitemap, robots

**Commit:** `feat:✨ add public event app`

---

## Fase 5 — Dashboard (`apps/admin`)

- [ ] **`/login` y `/denied`** — en v1 no existen y `requireMembership()` redirige
      a un 404; empezar por acá
- [ ] Listado y detalle de eventos, con fase resuelta
- [ ] ABM de eventos, jornadas y sedes
- [ ] Catálogo de spots + agregar a evento
- [ ] Generación de QR
- [ ] Participantes y métricas
- [ ] Sorteo (mudado desde la app pública)

**Commit:** `feat:✨ add organization dashboard`

---

## Fase 6 — Landing

- [ ] `apps/landing` — marketing de Eventdex

**Commit:** `feat:✨ add marketing landing`

---

## Fase 7 — Panel de plataforma

- [ ] Vista cross-organización (solo lectura)
- [ ] ABM de facturación
- [ ] Lectura de `audit_logs`

**Commit:** `feat:✨ add platform admin panel`

---

## Fuera de la v1

Modelado en la base, sin interfaz todavía. Habilitarlo después **no requiere
migración** — por eso está en el esquema desde el día 1.

| Diferido | Ya está en el modelo |
|----------|----------------------|
| Panel del expositor | `event_members`, `event_spot_exhibitors`, políticas y grants de columna |
| Spots con puntaje variable | `event_spots.points`, `spot_claims.points_awarded` |
| Múltiples dominios por organización | `organization_domains` |
| Claims en el JWT | Documentado en [04](./04-rls.md#la-alternativa-claims-en-el-jwt) |
| Pagos online | `event_invoices` con la forma correcta |

---

## Migración de datos: descartada

**Decisión (2026-08-03): se arranca con un proyecto Supabase limpio.** No se
migra ningún dato de v1.

Consecuencias prácticas:

- Los `sql/` no llevan `drop`, no tienen scripts de mapeo, y asumen una base
  vacía. Ya están escritos así.
- **El proyecto de v1 no se toca.** Queda intacto como respaldo de consulta
  hasta que la v2 esté en producción y verificada. Recién ahí se decide qué
  hacer con él.
- Los usuarios de v1 no existen en el proyecto nuevo: quien vuelva a entrar
  crea una cuenta nueva y su historial de medallas arranca en cero. Si algún
  evento pasado tiene datos que valga la pena mostrar, se exportan a mano y se
  cargan con `source = 'import'` — pero eso es una tarea de contenido, no una
  migración.
- Hay que **reconfigurar el proveedor OAuth (Google)** en el proyecto nuevo:
  client id, secret y URLs de callback autorizadas.

Si más adelante aparece la necesidad de traer datos, el punto difícil sería
`user_spot_history` → `spot_claims`: la FK compuesta exige un
`event_registrations` por cada par (evento, usuario), y esa tabla no existe en
v1 — habría que derivarla de los escaneos con un `group by`. Queda anotado por
si acaso, no como trabajo planificado.
