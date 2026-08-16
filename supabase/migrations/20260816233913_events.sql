-- 004 — Eventos
--
-- events, event_schedules, event_members, event_spots, event_spot_exhibitors.

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------

create table public.events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid   not null references public.organizations (id) on delete cascade,
  series_id       uuid   references public.event_series (id) on delete set null,
  venue_id        uuid   references public.venues (id)       on delete set null,
  slug            extensions.citext not null,
  title           text   not null,
  edition_label   text,                          -- "2026", "Vol. 3"
  edition_number  int,                           -- ordena las ediciones de una serie
  summary         text,                          -- metadata / OG
  description     text,
  cover_path      text,
  timezone        text not null default 'America/Argentina/Buenos_Aires',
  status          public.event_status     not null default 'draft',
  visibility      public.event_visibility not null default 'public',
  -- Sorteo habilitado, meta de medallas, override de tema.
  settings        jsonb not null default '{}'::jsonb,
  published_at    timestamptz,
  created_by      uuid references public.profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,
  deleted_at      timestamptz,

  unique (organization_id, slug)
);

-- Dos ediciones de una serie no pueden compartir número.
create unique index events_series_edition_unique
  on public.events (series_id, edition_number)
  where series_id is not null and edition_number is not null and deleted_at is null;

-- Camino más caliente de la app pública: los eventos publicados de una org.
create index events_org_status_idx
  on public.events (organization_id, status)
  where deleted_at is null;

create trigger events_set_updated_at
  before update on public.events
  for each row execute function app.set_updated_at();

-- ---------------------------------------------------------------------------
-- event_schedules — jornadas
--
-- timestamptz, NO timestamp. La v1 guardaba sin zona y el código lo compensaba
-- appendeando "Z" a mano (resolveScheduleDateTime). Con timestamptz el instante
-- es inequívoco en la base y `events.timezone` se usa solo para MOSTRAR la hora
-- local del evento, que es su función real.
-- ---------------------------------------------------------------------------

create table public.event_schedules (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events (id)        on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  label           text,                          -- "Día 1"
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,

  constraint event_schedules_range check (ends_at > starts_at)
);

create index event_schedules_event_idx on public.event_schedules (event_id, starts_at);

create trigger event_schedules_set_updated_at
  before update on public.event_schedules
  for each row execute function app.set_updated_at();

-- Opcional (requiere btree_gist): impide jornadas solapadas del mismo evento.
-- Recomendado, no bloqueante para v1.
-- alter table public.event_schedules
--   add constraint event_schedules_no_overlap
--   exclude using gist (
--     event_id with =,
--     tstzrange(starts_at, ends_at) with &&
--   );

-- ---------------------------------------------------------------------------
-- event_members — equipo de un evento puntual
--
-- Separado de organization_members porque `exhibitor` no tiene sentido a nivel
-- organización y porque las políticas RLS quedan más simples con dos preguntas
-- independientes. Ver docs/adr/0004-modelo-de-roles.md
-- ---------------------------------------------------------------------------

create table public.event_members (
  id              uuid not null default gen_random_uuid() primary key,
  event_id        uuid not null references public.events (id)        on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id)      on delete cascade,
  role            public.event_role not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,

  unique (event_id, user_id)
);

create index event_members_user_event_idx on public.event_members (user_id, event_id);

create trigger event_members_set_updated_at
  before update on public.event_members
  for each row execute function app.set_updated_at();

-- ---------------------------------------------------------------------------
-- event_spots — la RELACIÓN entre un spot del catálogo y un evento
--
-- Todo lo que es propio de ESTA edición vive acá: el código del QR, el puesto,
-- si está activo, los puntos y los overrides.
-- ---------------------------------------------------------------------------

create table public.event_spots (
  id                    uuid primary key default gen_random_uuid(),  -- lo que apunta el QR
  event_id              uuid   not null references public.events (id)        on delete cascade,
  organization_id       uuid   not null references public.organizations (id) on delete cascade,
  -- RESTRICT: no se puede borrar un spot del catálogo usado en algún evento.
  -- Se archiva (spots.archived_at) y deja de ofrecerse.
  spot_id               uuid   not null references public.spots (id)  on delete restrict,
  code                  extensions.citext not null,                             -- código corto legible: "A12"
  name_override         text,                                        -- override de esta edición
  description_override  text,
  avatar_path_override  text,
  booth                 text,                                        -- "Pabellón A · 12"
  status                public.event_spot_status not null default 'active',
  points                int  not null default 1,
  sort_order            int  not null default 0,
  -- Copia congelada al publicar el evento: hace que renombrar el spot en el
  -- catálogo no reescriba la historia de ediciones pasadas.
  snapshot              jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz,
  deleted_at            timestamptz,

  constraint event_spots_points_positive check (points > 0)
);

create unique index event_spots_event_spot_unique
  on public.event_spots (event_id, spot_id) where deleted_at is null;

create unique index event_spots_event_code_unique
  on public.event_spots (event_id, code) where deleted_at is null;

create index event_spots_event_idx
  on public.event_spots (event_id) where deleted_at is null;

create index event_spots_spot_idx on public.event_spots (spot_id);

create trigger event_spots_set_updated_at
  before update on public.event_spots
  for each row execute function app.set_updated_at();

-- ---------------------------------------------------------------------------
-- event_spot_exhibitors — quién atiende cada spot
--
-- El modelo existe desde el día 1 aunque la interfaz del expositor quede para
-- v2: habilitarlo después no requiere migración.
-- ---------------------------------------------------------------------------

create table public.event_spot_exhibitors (
  id              uuid primary key default gen_random_uuid(),
  event_spot_id   uuid not null references public.event_spots (id)   on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id)      on delete cascade,
  can_edit        boolean not null default true,
  created_at      timestamptz not null default now(),

  unique (event_spot_id, user_id)
);

create index event_spot_exhibitors_user_idx on public.event_spot_exhibitors (user_id);
