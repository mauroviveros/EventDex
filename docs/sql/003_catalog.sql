-- 003 — Catálogo reutilizable de la organización
--
-- venues, spots, event_series. Todo existe SIN evento: es lo que permite
-- reutilizarlo entre ediciones. Ver docs/adr/0003-spots-reutilizables.md

-- ---------------------------------------------------------------------------
-- venues — sedes reutilizables
--
-- Reemplaza `event_locations`, que era 1:1 con el evento y obligaba a retipear
-- la dirección en cada edición.
-- ---------------------------------------------------------------------------

create table public.venues (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  address_line    text,
  city            text,
  state           text,
  country         char(2),                       -- ISO 3166-1 alpha-2
  postal_code     text,
  latitude        numeric(9,6),
  longitude       numeric(9,6),
  -- La sede define la zona horaria; el evento la hereda al crearse.
  timezone        text not null default 'America/Argentina/Buenos_Aires',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,
  deleted_at      timestamptz,

  constraint venues_latitude_range  check (latitude  is null or latitude  between -90  and 90),
  constraint venues_longitude_range check (longitude is null or longitude between -180 and 180)
);

create index venues_org_idx on public.venues (organization_id) where deleted_at is null;

create trigger venues_set_updated_at
  before update on public.venues
  for each row execute function app.set_updated_at();

-- ---------------------------------------------------------------------------
-- spots — el catálogo
--
-- ESTE es el cambio central: un spot pertenece a la ORGANIZACIÓN, no al evento.
-- ---------------------------------------------------------------------------

create table public.spots (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid   not null references public.organizations (id) on delete cascade,
  slug            citext not null,
  name            text   not null,
  description     text,
  type            public.spot_type not null default 'stand',
  avatar_path     text,
  -- Contacto, redes, rubro. Datos que no participan de ninguna consulta.
  metadata        jsonb  not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,
  archived_at     timestamptz,

  unique (organization_id, slug)
);

create index spots_org_idx on public.spots (organization_id) where archived_at is null;

create trigger spots_set_updated_at
  before update on public.spots
  for each row execute function app.set_updated_at();

-- ---------------------------------------------------------------------------
-- event_series — el evento recurrente como concepto
--
-- "Expo Ubbe" es la serie; "Expo Ubbe 2026" es un `events`. Es lo que hace
-- posible republicar una edición nueva y relacionarlas entre sí.
-- ---------------------------------------------------------------------------

create table public.event_series (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid   not null references public.organizations (id) on delete cascade,
  slug            citext not null,
  name            text   not null,
  description     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,
  archived_at     timestamptz,

  unique (organization_id, slug)
);

create index event_series_org_idx on public.event_series (organization_id);

create trigger event_series_set_updated_at
  before update on public.event_series
  for each row execute function app.set_updated_at();
