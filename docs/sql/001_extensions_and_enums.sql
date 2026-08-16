-- 001 — Extensiones, esquema de helpers y enums
--
-- Se aplica primero. Todo lo demás depende de esto.

-- Todas en el esquema `extensions`, que es donde Supabase las pone. Importa:
-- las funciones de negocio corren con `search_path = ''` (obligatorio para
-- security definer), así que cualquier tipo o función de extensión tiene que
-- referenciarse calificado — de ahí `extensions.citext` en el resto del esquema.
create extension if not exists "pgcrypto"   with schema extensions;  -- gen_random_uuid()
create extension if not exists "citext"     with schema extensions;  -- comparación case-insensitive
create extension if not exists "btree_gist" with schema extensions;  -- constraint de exclusión en jornadas (opcional)

-- Esquema para los helpers de autorización. NO se expone vía PostgREST
-- (Supabase publica solo `public` y `graphql_public`), así que nadie puede
-- llamarlos desde el cliente.
create schema if not exists app;
revoke all on schema app from public, anon, authenticated;
grant usage on schema app to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Enums
--
-- Convención: nombre en snake_case singular, valores en minúscula.
-- La v1 mezclaba `event_status` con `SPOT_STATUS`; acá es uniforme.
-- ---------------------------------------------------------------------------

create type public.platform_role       as enum ('developer', 'support');
create type public.organization_status as enum ('active', 'suspended');
create type public.organization_role   as enum ('owner', 'staff');
create type public.event_role          as enum ('manager', 'staff', 'exhibitor');
create type public.membership_status   as enum ('invited', 'active', 'revoked');

-- Ciclo de vida EDITORIAL del evento. No confundir con la fase temporal
-- (upcoming/live/finished), que se calcula desde las jornadas y nunca se guarda.
create type public.event_status        as enum ('draft', 'published', 'archived', 'cancelled');
create type public.event_visibility    as enum ('public', 'unlisted');

create type public.spot_type           as enum ('stand', 'attraction', 'sponsor', 'activity');
create type public.event_spot_status   as enum ('active', 'inactive');

create type public.registration_status as enum ('active', 'blocked');
create type public.claim_source        as enum ('qr', 'manual', 'import');
create type public.raffle_status       as enum ('draft', 'open', 'closed');
create type public.invoice_status      as enum ('draft', 'pending', 'paid', 'void');

-- Fase temporal: es un tipo para poder devolverlo desde vistas y funciones,
-- pero NO se persiste en ninguna columna.
create type public.event_phase         as enum ('upcoming', 'live', 'finished');

-- ---------------------------------------------------------------------------
-- Trigger genérico de updated_at
-- ---------------------------------------------------------------------------

create or replace function app.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
