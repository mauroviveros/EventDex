# SQL del esquema v2

Migraciones del esquema nuevo, en orden de aplicación. Escritas contra un
proyecto Supabase **limpio**: no contienen `drop`, no migran datos de v1.

| Archivo | Contenido |
|---------|-----------|
| `001_extensions_and_enums.sql` | Extensiones, esquema `app`, todos los enums, trigger de `updated_at` |
| `002_identity_and_tenancy.sql` | `profiles`, `platform_admins`, `organizations`, `organization_domains`, `organization_members` |
| `003_catalog.sql` | `venues`, `spots`, `event_series` — el catálogo reutilizable |
| `004_events.sql` | `events`, `event_schedules`, `event_members`, `event_spots`, `event_spot_exhibitors` |
| `005_participation.sql` | `event_registrations`, `spot_claims`, `raffles`, `raffle_draws` |
| `006_billing_and_audit.sql` | `event_invoices`, `audit_logs` |
| `007_functions_and_views.sql` | Helpers `app.*`, vistas, y funciones de negocio |
| `008_rls.sql` | Políticas RLS, triggers de guardia y grants |
| `009_seed.sql` | Datos de desarrollo |

## Cómo aplicarlo

```bash
supabase db reset
```

Copiando cada archivo a `supabase/migrations/` con su timestamp. O, para probar
rápido, pegándolos en orden en el SQL Editor del dashboard.

⚠️ `009_seed.sql` necesita dos usuarios existentes en `auth.users`. Creálos desde
el dashboard y reemplazá los UUID del bloque `declare`.

## Dos cosas que no son obvias y conviene no romper

**1. Recursión en las políticas.** Una política sobre `events` no puede consultar
la vista `event_timeline`, porque la vista lee `events` y la política se
dispararía a sí misma. Por eso existe `app.event_phase()`, que es
`security definer` y corta el ciclo. La misma trampa aplica a
`organization_members`: cualquier política sobre esa tabla que la consulte tiene
que hacerlo a través de un helper `security definer`.

**2. Los grants de columna no sirven para separar roles.** En Supabase todo
usuario logueado es el rol `authenticated`, así que `grant update (col)` limita a
todos por igual. La restricción de columnas del expositor la hace el trigger
`app.guard_exhibitor_columns()`.

## Verificación

Después de aplicar todo:

```sql
-- 1. RLS habilitado en todas las tablas de public
select tablename, rowsecurity
from pg_tables where schemaname = 'public' and not rowsecurity;
-- debe devolver 0 filas

-- 2. Ninguna tabla con RLS pero sin políticas (devolvería siempre vacío)
select t.tablename
from pg_tables t
left join pg_policies p on p.tablename = t.tablename and p.schemaname = 'public'
where t.schemaname = 'public'
group by t.tablename having count(p.policyname) = 0;

-- 3. Toda columna usada en políticas tiene índice
--    (revisión manual contra los índices de 002-006)

-- 4. El evento activo se resuelve bien
select e.title, e.edition_label, t.phase
from public.events e
join public.event_timeline t on t.event_id = e.id
where e.id = public.resolve_active_event(
  public.resolve_organization('localhost:4321')
);
```

El checklist de tests de permisos está en [`../04-rls.md`](../04-rls.md#cómo-se-prueba).
