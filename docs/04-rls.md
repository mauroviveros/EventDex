# 04 — Row Level Security

## El cambio de fondo

En v1 la autorización vive en el código: casi toda lectura administrativa usa la
`service_role` key, que **se saltea RLS por diseño**, y el aislamiento entre
organizaciones depende de que cada query se acuerde de filtrar por
`organization_id`. Un `.eq("organization_id", ...)` olvidado expone datos de otro
cliente.

En v2 **RLS es la barrera real**. Las apps usan la clave publishable y la base
decide qué fila devuelve. El código de negocio pasa a ocuparse de reglas de
negocio, no de aislamiento.

## Principios

1. **RLS habilitado en todas las tablas de `public`.** Sin excepción. Una tabla sin
   políticas y con RLS activo devuelve cero filas, que es el default correcto.
2. **`organization_id` en cada tabla de tenant.** Toda política de org es una
   comparación contra una columna indexada, no una cadena de joins.
3. **Helpers `security definer` en el esquema `app`.** No expuesto por PostgREST,
   así que nadie los llama desde el cliente. Al ser `security definer` no disparan
   RLS recursivo al consultar las tablas de membresía.
4. **`(select ...)` alrededor de toda llamada a función en una política.** Postgres
   la evalúa una vez por query en vez de una vez por fila. Es la diferencia entre
   una query de 10ms y una de 2s sobre `spot_claims`.
5. **Índice sobre toda columna que aparezca en una política.**
6. **`security_invoker = true` en todas las vistas.** Sin eso una vista corre con
   los permisos de quien la creó y es un agujero silencioso.

## Esquema `app` — helpers

Todos `security definer`, `stable`, con `set search_path = ''`.

```sql
app.current_user_id()          -- (select auth.uid()), envuelto una sola vez
app.is_platform_admin()        -- ∃ fila en platform_admins
app.is_developer()             -- ídem con level = 'developer'
app.org_role(org uuid)         -- organization_role | null
app.is_org_member(org uuid)    -- owner o staff, status = 'active'
app.is_org_owner(org uuid)     -- role = 'owner'
app.event_role(event uuid)     -- event_role | null
app.can_view_event(event uuid) -- miembro de la org, del evento, o developer
app.can_edit_event(event uuid) -- staff+ de la org o manager/staff del evento
app.is_event_exhibitor(event_spot uuid)  -- ∃ fila en event_spot_exhibitors
app.is_registered(event uuid)  -- registro activo en el evento
```

`set search_path = ''` no es cosmético: sin eso, un esquema malicioso en el path
puede secuestrar una función `security definer`.

### La alternativa: claims en el JWT

Para el camino más caliente (la app pública leyendo evento y spots en cada
request), cada política dispara un lookup a `organization_members`. Se puede
evitar con un **Custom Access Token Hook** que embeba las membresías en el JWT:

```sql
-- La política pasa de un lookup a leer un claim ya presente en el token
using ( organization_id::text = any(
  select jsonb_array_elements_text(auth.jwt() -> 'app_metadata' -> 'orgs')
))
```

Tradeoff: el token queda desactualizado hasta el refresh (1 hora por defecto)
cuando cambia un rol. **Recomendación: helpers SQL en v1** — son correctos siempre
y el volumen no lo justifica todavía. El hook queda anotado como optimización si
aparece el problema, no antes.

## Políticas por tabla

Notación: `anon` = visitante sin sesión · `auth` = con sesión.

### `profiles`

| Operación | Quién |
|-----------|-------|
| SELECT | El propio usuario · miembros de una org donde el usuario participa · platform admins |
| INSERT | Nadie (lo hace el trigger `handle_new_user`) |
| UPDATE | Solo el propio usuario |
| DELETE | Nadie (cascada desde `auth.users`) |

El SELECT ampliado es lo que permite que el dashboard liste participantes sin
recurrir a la service key — que es exactamente lo que hace la v1 hoy en
`getEventParticipants`.

### `platform_admins`

| Operación | Quién |
|-----------|-------|
| SELECT | Solo platform admins |
| INSERT / UPDATE / DELETE | Nadie vía API. Solo por SQL directo |

Deliberado: darse acceso total a la plataforma no debe ser una acción de aplicación.

### `organizations`

| Operación | Quién |
|-----------|-------|
| SELECT | `anon` y `auth` si `status = 'active'` y no está borrada — **solo columnas públicas** vía vista |
| UPDATE | `owner` · nunca developer |
| INSERT / DELETE | Solo por SQL / proceso de alta |

Nota: la app pública necesita el nombre y la marca de la organización para la
metadata. En v1 eso se resolvía con la service key (`getOrganization` lo dice
explícitamente: "RLS no expone `organizations` al visitante anónimo"). En v2 se
expone una vista `public_organizations` con las columnas públicas — no hace falta
service key.

### `organization_domains`

| Operación | Quién |
|-----------|-------|
| SELECT | Público (es un lookup de host; no revela nada que el DNS no diga) |
| INSERT / UPDATE / DELETE | `owner` |

### `organization_members`

| Operación | Quién |
|-----------|-------|
| SELECT | Miembros de la misma org · platform admins |
| INSERT / UPDATE / DELETE | `owner` de esa org |

⚠️ Riesgo de recursión: una política sobre `organization_members` que consulte
`organization_members` cuelga. Por eso los helpers son `security definer`.

### `venues`, `spots`, `event_series` (catálogo)

| Operación | Quién |
|-----------|-------|
| SELECT | Miembros de la org · platform admins |
| INSERT / UPDATE | `staff` y `owner` |
| DELETE | Nadie (`archived_at` / `deleted_at`); el owner archiva vía UPDATE |

Los spots del catálogo **no son públicos**. Lo público es el spot del evento
(`event_spots`) de un evento publicado.

### `events`

| Operación | Quién |
|-----------|-------|
| SELECT | Público si `status = 'published'`, `visibility = 'public'` y `deleted_at IS NULL` · miembros de la org en cualquier estado · miembros del evento · platform admins |
| INSERT | `staff` y `owner` |
| UPDATE | `staff` y `owner` de la org · `manager` del evento. **Bloqueado si el evento está finalizado** (excepto owner) |
| DELETE | Nadie. La baja es `UPDATE deleted_at`, permitida solo al `owner` |

El bloqueo sobre eventos finalizados se hace con un `WITH CHECK` que consulta
`event_timeline`. En v1 esto vivía en `requireEditableEvent()` y era saltable si
alguien llamaba la server action directo.

### `event_schedules`

Hereda el acceso de su evento: SELECT si podés ver el evento, escritura si podés
editarlo.

### `event_members`

| Operación | Quién |
|-----------|-------|
| SELECT | Miembros de la org · el propio usuario |
| INSERT / UPDATE / DELETE | `staff`/`owner` de la org · `manager` del evento |

### `event_spots`

La tabla con más matices, porque la ve todo el mundo.

| Operación | Quién |
|-----------|-------|
| SELECT | Público si el evento es público **y** `status = 'active'` **y** `deleted_at IS NULL` · miembros de la org (todos, incluso inactivos) · expositores asignados |
| INSERT | `staff` / `owner` |
| UPDATE | `staff` / `owner` · **expositor asignado, solo columnas de presentación** |
| DELETE | Nadie (`deleted_at`) |

El límite del expositor tiene dos mitades:

1. **Qué filas** → RLS. Política de `UPDATE` que permite la fila si el usuario es
   expositor asignado (`app.is_event_exhibitor`).
2. **Qué columnas** → un trigger, `app.guard_exhibitor_columns()`, que rechaza el
   UPDATE si quien no puede editar el evento tocó algo distinto de
   `name_override`, `description_override` o `avatar_path_override`.

> ⚠️ La segunda mitad **no** se puede hacer con `GRANT UPDATE (columnas)`.
> Los privilegios de columna se otorgan a un **rol de Postgres**, y en Supabase
> todo usuario logueado es el mismo rol: `authenticated`. Un grant que limitara
> al expositor limitaría igual al staff. Los grants de columna solo sirven
> cuando hay un rol de base por tipo de usuario, que no es el caso acá.

Que un QR de un spot inactivo o borrado no entregue medalla deja de ser una regla
de la aplicación (`.is("deleted_at", null)` repetido en cada query de v1) y pasa a
ser invisibilidad a nivel base.

### `event_spot_exhibitors`

| Operación | Quién |
|-----------|-------|
| SELECT | Miembros de la org · el propio expositor |
| INSERT / UPDATE / DELETE | `staff` / `owner` |

### `event_registrations`

| Operación | Quién |
|-----------|-------|
| SELECT | El propio usuario · miembros de la org · platform admins |
| INSERT | El propio usuario (`user_id = app.current_user_id()`), solo sobre eventos públicos y publicados |
| UPDATE | El propio usuario (limitado) · `staff`/`owner` para bloquear |
| DELETE | Nadie |

El `WITH CHECK` del INSERT es lo que impide registrarse a un evento en borrador o
inexistente.

### `spot_claims`

| Operación | Quién |
|-----------|-------|
| SELECT | El propio usuario · miembros de la org · platform admins |
| INSERT | **Nadie directamente.** Solo vía `claim_spot()` |
| UPDATE / DELETE | Nadie |

Reclamar es una transacción con reglas (¿está el evento en curso?, ¿el spot está
activo?, ¿ya lo tenía?), así que se expone como función `security definer` y no
como INSERT libre. Eso además la hace atómica: en v1 `collectMedal` hace un SELECT
y después un INSERT, y depende del índice único para cerrar la carrera. Con una
función es un solo `insert ... on conflict do nothing returning`.

Inmutable a propósito: un reclamo es un hecho histórico. Si hay que revertirlo, se
hace por SQL y queda en `audit_logs`.

### `raffles` y `raffle_draws`

| Tabla | SELECT | Escritura |
|-------|--------|-----------|
| `raffles` | Miembros de la org | `staff` / `owner` |
| `raffle_draws` | **Público** si el evento es público (los ganadores se anuncian) | Solo vía `draw_raffle()` |

### `event_invoices`

| Operación | Quién |
|-----------|-------|
| SELECT | `owner` de esa org (solo lo suyo) · platform admins (todo) |
| INSERT / UPDATE | Solo `app.is_developer()` |
| DELETE | Nadie (`status = 'void'`) |

Es la única tabla donde el developer escribe. El staff ni la ve.

### `audit_logs`

| Operación | Quién |
|-----------|-------|
| SELECT | `owner` de esa org · platform admins |
| INSERT | Solo triggers y funciones `security definer` |
| UPDATE / DELETE | Nadie |

## Cuándo sí usar la service key

La service key **no desaparece**, pero pasa a ser excepción documentada. Casos
legítimos:

| Caso | Por qué |
|------|---------|
| Trigger de alta de usuario | Corre fuera de una sesión |
| Alta de una organización nueva | No hay miembros todavía; el owner se crea en la misma transacción |
| Jobs / cron | Sin usuario |
| Backfills y migraciones | Operaciones puntuales, no de aplicación |

Regla práctica: **si una pantalla necesita la service key, falta una política.**
En v1 hay tres casos que caen exactamente ahí y en v2 se resuelven con RLS:
`getOrganization` (→ vista `public_organizations`), `getMembership`
(→ política de `organization_members`) y `getEventParticipants`
(→ política ampliada de `profiles`).

## Cómo se prueba

Sin tests, una matriz de permisos de este tamaño se rompe sola.

```sql
-- pgTAP: por cada tabla y cada rol, afirmar qué ve y qué no.
set local role authenticated;
set local request.jwt.claims = '{"sub":"<uuid-del-visitante>"}';
select is_empty('select * from events where status = ''draft''');
```

Mínimo a cubrir antes de dar el esquema por bueno:

- [ ] Un usuario de la org A no ve **ninguna** fila de la org B, en ninguna tabla.
- [ ] `anon` ve eventos publicados y no ve borradores.
- [ ] `anon` no ve spots inactivos ni borrados.
- [ ] Un `staff` no puede borrar; un `owner` sí.
- [ ] Un expositor solo actualiza sus columnas y sus filas.
- [ ] Un developer lee todo y no puede escribir nada fuera de facturación.
- [ ] Nadie puede insertar en `spot_claims` salteando `claim_spot()`.
- [ ] No se puede reclamar sin registro previo.

Estos tests son la red que hace que tocar una política después no dé miedo.
