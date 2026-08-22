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
- [x] Proyecto Supabase nuevo, vacío. El de v1 no se toca: queda como respaldo
      de consulta hasta que la v2 esté en producción
- [x] `pnpm db:link` contra el proyecto nuevo
- [x] `pnpm db:push` y verificar con `supabase/tests/verify.sql`
- [x] Crear los dos usuarios de prueba y correr `supabase/seed.sql`
- [x] `pnpm db:types` → `packages/db`
- [ ] Configurar los proveedores OAuth (**Google** y **GitHub**) — ver Fase 4
- [ ] Tests de permisos del checklist de [04](./04-rls.md#cómo-se-prueba)

### Correcciones que salieron de cablear `apps/web`

Dos huecos que ningún check podía ver hasta que una app consultó como visitante
anónimo. Están en migraciones propias porque las migraciones son append-only:

- [x] `010_public_catalog_reads` — `venues` y `spots` tenían políticas
      `to authenticated`, así que el anónimo recibía **cero filas** de las dos:
      sin sede en la landing y sin nombres en la grilla de stands. Contradecía
      al [ADR-0003](./adr/0003-spots-reutilizables.md), que hace caer la
      resolución a `spots.name`.
- [x] `011_fix_owner_guard_on_cascade` — el trigger del último owner bloqueaba
      el borrado en cascada de una organización entera.
- [x] El seed publica con `publish_event()` en vez de escribir
      `status = 'published'`: así congela los snapshots y ejercita la función.
- [x] `supabase/snippets/reset-seed.sql` para volver a sembrar.

**Commit:** `feat:🗃️ add v2 database schema with RLS`

---

## Fase 3 — Núcleo compartido

- [x] `packages/db` — tipos generados + DTOs
- [x] `packages/supabase` — clientes browser / astro / next / service
- [x] `packages/domain` — fase del evento, resolución de spots, progreso y
      elegibilidad de sorteo. **Puro, sin I/O, 34 tests sin un solo mock**
- [ ] `packages/auth` — sesión y guards, un adaptador por runtime
- [ ] `packages/ui` — tokens + primitivas shadcn compartidas

**`auth` y `ui` se difieren a propósito.** El camino del visitante no necesita
guards: es `getClaims()` y listo. Lo que justifica un paquete de auth son los
guards de membresía y rol, y esos aparecen recién con el admin (Fase 5).
Escribir `requireMembership()` ahora sería adivinar la firma sin consumidor —
el mismo criterio con el que quedaron afuera `slug.ts` y `canPublishEvent`.
`ui` espera todavía más: con una sola app con pantallas, extraer componentes
"compartidos" es especulativo.

**Commit:** `feat:📦 add shared packages (db, supabase, domain)`

---

## Fase 4 — App pública (`apps/web`)

- [x] Middleware: host → organización → evento activo, en `Astro.locals`
- [x] `/` landing: fase, sede, jornadas formateadas y grilla de spots
- [x] `/` countdown (isla React, usa `timeUntil`)
- [x] Login con **Google** y **GitHub** + `auth/callback` + `auth/error`
- [x] `/s/[id]` reclamo de medalla (`claim_spot()`)
- [x] `/perfil` progreso del visitante (usa `collectionProgress`)
- [x] SEO: Open Graph, JSON-LD `Event`, sitemap y robots por host
- [ ] `og:image` — **bloqueado por Storage**, ver más abajo

### Lo que salió de cablear la app

- [x] `resolve_site()` — el middleware hacía dos viajes por request y el primero
      tiraba el resto de la fila. Ahora resuelve organización + evento en una
      sola llamada, y de paso trae el nombre y la marca para el `<title>` y el
      `og:site_name`.
- [x] `toZonedIso()` en domain — Google usa `startDate` para mostrar el **día**,
      y un evento que arranca 21:00 GMT-3 es medianoche UTC del día siguiente.
      Emitir en UTC mostraba la fecha corrida.
- [x] **CI** (`.github/workflows/ci.yml`) — lint, types, tests y build en cada
      push. Encontró un bug en el primer intento: `apps/admin` typechequeaba
      solo porque `.next/types/` ya existía en la máquina de desarrollo.
- [x] **51 tests** — 39 en `domain`, 12 en `apps/web`. Los de `safeNext` cubren
      la prevención de open redirect, que era código de seguridad sin red.

### Sobre los proveedores de login

Van **dos**: Google para los visitantes y **GitHub** para la cuenta de
desarrollo. Supabase une por email verificado, así que la misma persona entrando
por cualquiera de los dos cae en el mismo `auth.users` — importante para que la
fila de `platform_admins` siga valiendo sin importar por dónde entró.

Hay que habilitar ambos en el dashboard y autorizar las redirect URLs
(`http://localhost:4321/auth/callback` en desarrollo).

### Storage: prerrequisito de la Fase 5

`spots.avatar_path`, `organizations.logo_path` y `events.cover_path` guardan
rutas, pero **no hay ningún bucket creado ni políticas de Storage escritas**.

Empezó como deuda de SEO —por eso la grilla de spots no muestra imágenes y falta
el `og:image`— pero **cambió de categoría**: el dashboard necesita subir avatares
de spots, el logo de la organización y la portada del evento. El formulario de
spots lo va a pedir enseguida, así que conviene resolverlo temprano en la Fase 5
y no al final.

**Commit:** `feat:✨ add public event app`

---

## Fase 5 — Dashboard (`apps/admin`)

Dos cosas antes de escribir pantallas:

- [ ] **Tests de permisos RLS** — el checklist de
      [04](./04-rls.md#cómo-se-prueba). El admin es donde viven `owner`,
      `staff`, `manager`, `exhibitor` y `developer`, y hasta ahora solo se
      ejercitaron dos roles: anónimo y visitante. Los **dos huecos de RLS que
      aparecieron** en la Fase 4 los encontramos de casualidad cableando una
      pantalla; con cinco roles y veinte tablas, esperar a que aparezcan solos
      es una apuesta. Descubrir que `staff` puede borrar con diez vistas ya
      escritas cuesta mucho más que descubrirlo ahora.
- [ ] **Buckets y políticas de Storage** — ver Fase 4.
- [ ] `packages/auth` — extraer los guards cuando el admin muestre su forma
      real. `apps/web/src/lib/session.ts` (`getVisitor`) es la mitad que ya
      existe y está probada.

Después sí:

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
