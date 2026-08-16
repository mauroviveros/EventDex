# 03 — Modelo de datos

Esquema completo propuesto. El SQL ejecutable está en [`sql/`](./sql/); acá está
el **por qué** de cada decisión.

## Convenciones

Se fijan ahora porque la v1 mezclaba tres estilos distintos en el mismo esquema
(`event_status` en minúscula, `SPOT_STATUS` en mayúscula, `id` a veces `uuid` y a
veces `bigserial`).

| Regla | Ejemplo |
|-------|---------|
| Tablas en `snake_case` plural | `event_spots` |
| Columnas en `snake_case` singular | `organization_id` |
| Enums en `snake_case` singular | `event_status` |
| Valores de enum en minúscula | `'draft'`, `'published'` |
| PK siempre `id uuid default gen_random_uuid()` | — |
| FK `<tabla_singular>_id` | `venue_id` |
| Timestamps con sufijo `_at`, siempre `timestamptz` | `created_at`, `published_at` |
| Booleanos con prefijo `is_` / `has_` / `can_` | `is_primary` |
| Baja lógica con `deleted_at`, nunca `DELETE` | — |
| Dinero en enteros (centavos), nunca `float` | `amount_cents bigint` |

**Regla dura: toda tabla de tenant lleva `organization_id`**, aunque sea derivable
por join. No es desnormalización gratuita — es lo que permite que cada política RLS
sea un índice simple en vez de una cadena de subqueries. Un trigger lo mantiene
consistente para que no pueda desincronizarse.

## Cambios de fondo respecto de v1

| v1 | v2 | Por qué |
|----|-----|---------|
| `event_spots.event_id NOT NULL` | `spots` (catálogo) + `event_spots` (relación) | Reutilizar spots entre ediciones sin recargarlos |
| `events.edition text` | `event_series` → `events` | Relacionar ediciones entre sí; republicar |
| `event_locations` 1:1 con evento | `venues` reutilizable | No retipear la dirección cada edición |
| `event_schedules.*_datetime` sin zona | `timestamptz` | Elimina el hack `resolveScheduleDateTime` que appendeaba `"Z"` |
| `user_spot_history` (bigserial) | `spot_claims` (uuid) | Nombre correcto; ids no enumerables |
| Registro implícito (existís si escaneaste) | `event_registrations` | Ancla de RLS, embudo, y bloqueo de abusadores |
| `organization_members` con `event_id` nullable | `organization_members` + `event_members` | Roles de evento y de org son cosas distintas |
| `raffle_winners` suelta | `raffles` + `raffle_draws` | Varios premios, y anular una extracción |
| `events.config jsonb` (muerta) | `organizations.brand` + `events.settings` | Se usaba para nada |
| Sin facturación | `event_invoices` | Requisito del rol developer |
| Sin auditoría | `audit_logs` | Acceso cross-org tiene que dejar rastro |
| Autorización en código con service key | RLS | El aislamiento lo garantiza la base |

## Enums

```sql
platform_role        : 'developer' | 'support'
organization_status  : 'active' | 'suspended'
organization_role    : 'owner' | 'staff'
event_role           : 'manager' | 'staff' | 'exhibitor'
membership_status    : 'invited' | 'active' | 'revoked'
event_status         : 'draft' | 'published' | 'archived' | 'cancelled'
event_visibility     : 'public' | 'unlisted'
spot_type            : 'stand' | 'attraction' | 'sponsor' | 'activity'
event_spot_status    : 'active' | 'inactive'
registration_status  : 'active' | 'blocked'
claim_source         : 'qr' | 'manual' | 'import'
raffle_status        : 'draft' | 'open' | 'closed'
invoice_status       : 'draft' | 'pending' | 'paid' | 'void'
```

### `event_status` vs fase del evento

Este es el error conceptual más grande de la v1: `event_status ACTIVE|INACTIVE`
mezclaba "¿está publicado?" con "¿ya pasó?".

- **`status`** = ciclo de vida **editorial**, lo decide una persona.
  `draft` → `published` → `archived`, o `cancelled`.
- **Fase** = ubicación **temporal**, la decide el reloj:
  `upcoming` → `live` → `finished`. **Nunca se guarda**, se calcula desde
  `event_schedules`.

Un evento `published` sin jornadas cargadas no tiene fase: no se puede ubicar en el
tiempo, y por eso queda fuera de la resolución del evento activo.

La fase se expone como vista `event_timeline`, así el cálculo es uno solo y sirve
tanto a SQL como a las apps.

## Tablas

### Identidad

#### `profiles`

Espejo de `auth.users`, creado por trigger en el signup.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid` PK | → `auth.users(id)` ON DELETE CASCADE |
| `email` | `citext` NOT NULL | |
| `full_name` | `text` NOT NULL | |
| `display_name` | `text` | Cómo quiere que lo llamen |
| `avatar_url` | `text` | |
| `locale` | `text` NOT NULL | default `'es-AR'` |
| `created_at` / `updated_at` | `timestamptz` | |

Se eliminan de v1: `initials` (derivable, se calcula en la UI) y `username`
(nunca se usó).

#### `platform_admins`

| Columna | Tipo | Notas |
|---------|------|-------|
| `user_id` | `uuid` PK | → `profiles(id)` |
| `level` | `platform_role` | `'developer'` \| `'support'` |
| `notes` | `text` | Para qué se le dio acceso |
| `granted_by` | `uuid` | → `profiles(id)` |
| `created_at` | `timestamptz` | |

Tabla propia y no un valor de enum: el acceso es cross-organización, así que
meterlo en `organization_role` obligaría a una membresía falsa por organización.
Además, tenerlo aislado hace trivial auditar quién tiene acceso total:
`select * from platform_admins`.

### Tenancy

#### `organizations`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid` PK | |
| `slug` | `citext` UNIQUE NOT NULL | |
| `name` | `text` NOT NULL | |
| `legal_name` | `text` | Para facturación |
| `logo_path` | `text` | Storage |
| `brand` | `jsonb` NOT NULL default `'{}'` | Colores, tipografías. Reemplaza `events.config` |
| `default_timezone` | `text` NOT NULL | default `'America/Argentina/Buenos_Aires'` |
| `status` | `organization_status` | |
| `created_at` / `updated_at` / `deleted_at` | | |

#### `organization_domains`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` NOT NULL | |
| `hostname` | `citext` UNIQUE NOT NULL | `expoubbe.com` |
| `is_primary` | `boolean` NOT NULL | Índice único parcial: uno solo por org |
| `verified_at` | `timestamptz` | |

Dijiste "en principio 1 dominio por organización". Una tabla en vez de una columna
cuesta lo mismo y cubre desde el día 1 los casos que aparecen sin avisar: apex +
`www`, el dominio de preview de Vercel, y una migración de dominio sin downtime
(los dos apuntan a la misma org durante la transición). El índice parcial sobre
`is_primary` mantiene la garantía de "un dominio canónico".

#### `organization_members`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` NOT NULL | |
| `user_id` | `uuid` NOT NULL | |
| `role` | `organization_role` NOT NULL | |
| `status` | `membership_status` NOT NULL | default `'active'` |
| `invited_by` | `uuid` | |
| `joined_at` | `timestamptz` | |

`UNIQUE (organization_id, user_id)`. Trigger `prevent_last_owner_removal`.

### Catálogo reutilizable

#### `venues`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` NOT NULL | |
| `name` | `text` NOT NULL | |
| `address_line` | `text` | |
| `city` / `state` | `text` | |
| `country` | `char(2)` | ISO 3166-1 alpha-2 |
| `postal_code` | `text` | |
| `latitude` / `longitude` | `numeric(9,6)` | |
| `timezone` | `text` NOT NULL | La sede define la zona, el evento la hereda |
| `created_at` / `updated_at` / `deleted_at` | | |

#### `spots` — el catálogo

**Este es el cambio que pediste.** Un spot existe por sí solo, dentro de la
organización, sin evento.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` NOT NULL | |
| `slug` | `citext` NOT NULL | UNIQUE con `organization_id` |
| `name` | `text` NOT NULL | |
| `description` | `text` | |
| `type` | `spot_type` NOT NULL | default `'stand'` |
| `avatar_path` | `text` | |
| `metadata` | `jsonb` NOT NULL default `'{}'` | Contacto, redes, rubro |
| `created_at` / `updated_at` / `archived_at` | | |

#### `event_series`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` NOT NULL | |
| `slug` | `citext` NOT NULL | UNIQUE con `organization_id` |
| `name` | `text` NOT NULL | "Expo Ubbe" |
| `description` | `text` | |

Es lo que hace posible "republicar con otra edición": la serie es el concepto
estable, cada `events` es una edición.

### Eventos

#### `events`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` NOT NULL | |
| `series_id` | `uuid` | → `event_series`. Null = evento único |
| `venue_id` | `uuid` | → `venues`. Null = online / a definir |
| `slug` | `citext` NOT NULL | UNIQUE con `organization_id` |
| `title` | `text` NOT NULL | |
| `edition_label` | `text` | "2026", "Vol. 3" |
| `edition_number` | `int` | UNIQUE con `series_id` — ordena las ediciones |
| `summary` | `text` | Para metadata / OG |
| `description` | `text` | |
| `cover_path` | `text` | |
| `timezone` | `text` NOT NULL | Copiada de la sede al crear, editable |
| `status` | `event_status` NOT NULL | default `'draft'` |
| `visibility` | `event_visibility` NOT NULL | default `'public'` |
| `settings` | `jsonb` NOT NULL default `'{}'` | Sorteo habilitado, meta de medallas, override de tema |
| `published_at` | `timestamptz` | |
| `created_by` | `uuid` | |
| `created_at` / `updated_at` / `deleted_at` | | |

#### `event_schedules`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid` PK | |
| `event_id` | `uuid` NOT NULL | ON DELETE CASCADE |
| `organization_id` | `uuid` NOT NULL | |
| `label` | `text` | "Día 1" |
| `starts_at` | `timestamptz` NOT NULL | |
| `ends_at` | `timestamptz` NOT NULL | `CHECK (ends_at > starts_at)` |

**`timestamptz`, no `timestamp`.** La v1 guardaba sin zona y el código tenía que
compensarlo appendeando `"Z"` a mano (`resolveScheduleDateTime`). Con `timestamptz`
el instante es inequívoco en la base; `events.timezone` se usa solo para
*mostrar* la hora local del evento, que es su función real.

Opcional: constraint de exclusión con `btree_gist` para impedir jornadas
solapadas del mismo evento. Recomendado, pero no bloqueante para v1.

#### `event_members`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid` PK | |
| `event_id` | `uuid` NOT NULL | |
| `organization_id` | `uuid` NOT NULL | |
| `user_id` | `uuid` NOT NULL | |
| `role` | `event_role` NOT NULL | `manager` \| `staff` \| `exhibitor` |

`UNIQUE (event_id, user_id)`.

#### `event_spots` — la relación

Acá vive lo que pediste: "en la relación tener info de la relación, como si está
activado o no".

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid` PK | Es lo que apunta el QR |
| `event_id` | `uuid` NOT NULL | ON DELETE CASCADE |
| `organization_id` | `uuid` NOT NULL | |
| `spot_id` | `uuid` NOT NULL | → `spots` ON DELETE RESTRICT |
| `code` | `citext` NOT NULL | Código corto legible: "A12" |
| `name_override` | `text` | Override de esta edición |
| `description_override` | `text` | |
| `avatar_path_override` | `text` | |
| `booth` | `text` | "Pabellón A · 12". Reemplaza el `location` libre de v1 |
| `status` | `event_spot_status` NOT NULL | default `'active'` |
| `points` | `int` NOT NULL default `1` | Habilita spots que valen más |
| `sort_order` | `int` NOT NULL default `0` | |
| `snapshot` | `jsonb` | Copia congelada al publicar |
| `created_at` / `updated_at` / `deleted_at` | | |

Índices únicos parciales: `(event_id, spot_id) WHERE deleted_at IS NULL` y
`(event_id, code) WHERE deleted_at IS NULL`.

##### Copia vs. referencia: la resolución

Planteaste la duda de si conviene copiar el spot o referenciarlo. La respuesta es
**las dos cosas, en momentos distintos**:

```
mientras el evento está en draft/upcoming  →  referencia viva
                                              (editás el catálogo, se refleja)
al publicar el evento                       →  se congela `snapshot`
                                              (el catálogo puede cambiar, la edición no)
```

Regla de resolución, implementada en la vista `event_spots_resolved` y en
`packages/domain`:

```
nombre efectivo = name_override
               ?? snapshot->>'name'      (si el evento ya se publicó)
               ?? spots.name             (referencia viva)
```

Por qué importa: si en 2027 renombrás el stand "Café Ubbe" a "Ubbe Coffee", el
histórico de la Expo 2026 tiene que seguir diciendo "Café Ubbe". Con referencia
pura se reescribe la historia; con copia pura perdés la comodidad de editar el
catálogo una vez y que se propague a los eventos que todavía no arrancaron.

`ON DELETE RESTRICT` sobre `spot_id`: no se puede borrar un spot del catálogo que
esté usado en algún evento. Se archiva (`archived_at`) y deja de ofrecerse.

#### `event_spot_exhibitors`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid` PK | |
| `event_spot_id` | `uuid` NOT NULL | |
| `organization_id` | `uuid` NOT NULL | |
| `user_id` | `uuid` NOT NULL | |
| `can_edit` | `boolean` NOT NULL default `true` | |

`UNIQUE (event_spot_id, user_id)`. Un expositor puede tener varios spots, y un
spot puede tener varios encargados.

### Participación

#### `event_registrations`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid` PK | |
| `event_id` | `uuid` NOT NULL | |
| `organization_id` | `uuid` NOT NULL | |
| `user_id` | `uuid` NOT NULL | |
| `status` | `registration_status` NOT NULL | default `'active'` |
| `source` | `text` | `'qr'`, `'landing'`, `'invite'` |
| `registered_at` | `timestamptz` NOT NULL | |

`UNIQUE (event_id, user_id)` — y esa unicidad es la que habilita la FK compuesta
de `spot_claims`.

Novedad respecto de v1, donde "estar registrado" era implícito (existías si habías
escaneado algo). Hacerlo explícito da cinco cosas: ancla para RLS ("podés leer el
evento al que te registraste"), la métrica registrados → escanearon, la posibilidad
de bloquear a alguien, contar asistentes con cero escaneos, y —porque el registro
es **por evento**— las **cohortes de visitantes nuevos vs. recurrentes** sin
guardar un solo dato extra.

Esa última se deriva comparando cada registro con los anteriores del mismo
usuario, y se expone en la vista `event_visitor_cohorts`:

| Campo | Significado |
|-------|-------------|
| `is_first_org_visit` | Primer registro del usuario en *esta* organización |
| `previous_org_events` | A cuántas ediciones previas de la org ya había venido |

El corte es **por organización**, no por plataforma: la vista respeta RLS, así
que la window function solo ve los registros de la organización que consulta.
Particionar solo por `user_id` daría resultados incorrectos, además de filtrar
información cross-tenant. La métrica de plataforma existe como
`public.platform_visitor_stats()`, restringida al rol developer.

**No se guarda en columnas a propósito.** Un `is_first_visit boolean` calculado al
insertar sería más rápido de leer, pero es dato derivado: se desincroniza en
cuanto se corrige un registro a mano. La window function sobre unos miles de filas
por evento, con el índice `(user_id, registered_at)`, es trivial. Si algún día
pesa, se materializa la vista — y recién ahí se paga el costo de mantenerla.

Ver [02 — Visitantes nuevos vs. recurrentes](./02-roles-y-permisos.md#visitantes-nuevos-vs-recurrentes).

#### `spot_claims`

Reemplaza `user_spot_history`.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid` PK | |
| `event_id` | `uuid` NOT NULL | |
| `organization_id` | `uuid` NOT NULL | |
| `event_spot_id` | `uuid` NOT NULL | → `event_spots` ON DELETE RESTRICT |
| `user_id` | `uuid` NOT NULL | |
| `points_awarded` | `int` NOT NULL default `1` | Copiado de `event_spots.points` |
| `source` | `claim_source` NOT NULL | default `'qr'` |
| `claimed_at` | `timestamptz` NOT NULL | |

Dos constraints que hacen el trabajo pesado:

```sql
UNIQUE (event_spot_id, user_id)
  -- idempotencia: dos escaneos simultáneos del mismo QR no duplican.
  -- Es el mismo índice que ya agregaste en v1, ahora nativo.

FOREIGN KEY (event_id, user_id)
  REFERENCES event_registrations (event_id, user_id)
  -- no se puede reclamar sin estar registrado. La base lo garantiza,
  -- no depende de que la server action se acuerde de chequearlo.
```

El `id` pasa de `bigserial` a `uuid`: un id secuencial en una tabla pública filtra
el volumen total de escaneos de la plataforma.

`event_id` está desnormalizado (es derivable vía `event_spots`) porque casi todas
las consultas del dashboard son "los reclamos de este evento" y ahorra un join en
el camino caliente, además de habilitar la FK compuesta de arriba.

#### `raffles` y `raffle_draws`

`raffles` — la configuración:

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid` PK | |
| `event_id` / `organization_id` | `uuid` NOT NULL | |
| `name` | `text` NOT NULL | default `'Sorteo'` |
| `status` | `raffle_status` NOT NULL | |
| `min_claims` | `int` NOT NULL default `1` | Elegibilidad |
| `exclude_staff` | `boolean` NOT NULL default `true` | |
| `created_by` | `uuid` | |

`raffle_draws` — cada extracción:

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid` PK | |
| `raffle_id` / `event_id` / `organization_id` | `uuid` NOT NULL | |
| `user_id` | `uuid` NOT NULL | Ganador |
| `prize_label` | `text` | |
| `claims_count` | `int` NOT NULL | Congelado al momento del sorteo |
| `drawn_by` | `uuid` NOT NULL | |
| `drawn_at` | `timestamptz` NOT NULL | |
| `voided_at` | `timestamptz` | El ganador no estaba presente |
| `void_reason` | `text` | |

`UNIQUE (raffle_id, user_id) WHERE voided_at IS NULL` — nadie gana dos veces el
mismo sorteo, pero si se anula su extracción vuelve al bolillero.

Contra la `raffle_winners` de v1: permite varios premios por evento y permite
anular sin borrar (que es lo que pasa siempre en la práctica: sale un nombre, no
está, se vuelve a sortear).

### Facturación y auditoría

#### `event_invoices`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` NOT NULL | |
| `event_id` | `uuid` | Null = cargo a nivel organización |
| `concept` | `text` NOT NULL | |
| `amount_cents` | `bigint` NOT NULL | Enteros. Nunca `float` para dinero |
| `currency` | `char(3)` NOT NULL | default `'ARS'` |
| `status` | `invoice_status` NOT NULL | |
| `issued_at` / `due_at` | `date` | |
| `paid_at` | `timestamptz` | |
| `marked_by` | `uuid` | El platform admin que la marcó |
| `notes` | `text` | |

#### `audit_logs`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `bigserial` PK | Append-only, alto volumen |
| `organization_id` | `uuid` | |
| `actor_id` | `uuid` | |
| `actor_role` | `text` | Congelado: el rol puede cambiar después |
| `action` | `text` NOT NULL | `'event.published'`, `'invoice.paid'` |
| `entity_type` / `entity_id` | | |
| `diff` | `jsonb` | |
| `created_at` | `timestamptz` | |

Existe principalmente por el rol developer: si alguien tiene acceso cross-org,
todo lo que toca tiene que quedar registrado.

## Vistas

| Vista | Para qué |
|-------|----------|
| `event_timeline` | `event_id`, `starts_at` (min), `ends_at` (max), `phase` calculada |
| `event_spots_resolved` | Spot del evento con overrides y snapshot ya resueltos |
| `event_visitor_cohorts` | Cada registro marcado como visitante nuevo o recurrente |
| `event_visitor_stats` | Resumen por evento: nuevos vs. recurrentes, y el desglose QR vs. landing |
| `event_stats` | Conteos por evento: spots activos, registrados, reclamos, completaron |
| `raffle_eligible` | Participantes elegibles de un sorteo, ya filtrados |

Las vistas se crean con `security_invoker = true` para que respeten el RLS de
quien consulta, en vez de saltearlo.

## Funciones

| Función | Qué hace |
|---------|----------|
| `resolve_active_event(org uuid)` | En curso → próximo → último terminado. Ver [05](./05-flujos.md) |
| `resolve_organization(hostname text)` | Host → organización |
| `claim_spot(event_spot uuid)` | Registra + reclama, idempotente, en una transacción |
| `publish_event(event uuid)` | Valida, congela snapshots, marca `published_at` |
| `duplicate_event(event uuid, ...)` | Republicar como nueva edición |
| `draw_raffle(raffle uuid, prize text)` | Elige ganador entre elegibles y lo persiste |

Los helpers de autorización (`app.is_developer()`, `app.org_role()`, etc.) están
documentados en [04 — RLS](./04-rls.md).

## Índices

Más allá de los de PK/FK:

```sql
-- Resolución multi-tenant (camino más caliente de la app pública)
organization_domains (hostname)                          -- ya es UNIQUE
events (organization_id, status) WHERE deleted_at IS NULL
event_schedules (event_id, starts_at)

-- Dashboard
event_spots (event_id) WHERE deleted_at IS NULL
spot_claims (event_id, claimed_at DESC)
spot_claims (user_id, event_id)
event_registrations (event_id, status)

-- RLS: toda columna que aparece en una política necesita índice
organization_members (user_id, organization_id)
event_members (user_id, event_id)
event_spot_exhibitors (user_id)
```

## Lo que queda pendiente de decidir

1. ~~**Migración de datos de v1.**~~ ✅ Decidido (2026-08-03): proyecto Supabase
   limpio, sin migrar. Los `sql/` ya están escritos contra una base vacía.
   Ver [06](./06-roadmap.md#migración-de-datos-descartada).
2. **`points` en spots.** Está modelado pero la mecánica actual es 1 medalla = 1
   spot. Si no lo vas a usar en v1, queda con default `1` y no molesta.
3. **Constraint de exclusión en `event_schedules`.** Requiere la extensión
   `btree_gist`. Recomendado, no bloqueante.
