-- 005 — Participación
--
-- event_registrations, spot_claims, raffles, raffle_draws.

-- ---------------------------------------------------------------------------
-- event_registrations — el visitante
--
-- Novedad respecto de v1, donde "estar registrado" era implícito: existías si
-- habías escaneado algo. Hacerlo explícito da cuatro cosas: ancla para RLS,
-- la métrica registrados→escanearon, poder bloquear a alguien, y contar
-- asistentes con cero escaneos.
-- ---------------------------------------------------------------------------

create table public.event_registrations (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events (id)        on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id)      on delete cascade,
  status          public.registration_status not null default 'active',
  source          text,                          -- 'qr', 'landing', 'invite'
  registered_at   timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,

  -- Esta unicidad es la que habilita la FK compuesta de spot_claims.
  unique (event_id, user_id)
);

create index event_registrations_event_status_idx
  on public.event_registrations (event_id, status);

create index event_registrations_user_idx
  on public.event_registrations (user_id);

create trigger event_registrations_set_updated_at
  before update on public.event_registrations
  for each row execute function app.set_updated_at();

-- ---------------------------------------------------------------------------
-- spot_claims — reemplaza user_spot_history
--
-- Un reclamo es un hecho histórico: se inserta y no se toca más.
-- ---------------------------------------------------------------------------

create table public.spot_claims (
  -- uuid y no bigserial: un id secuencial en una tabla pública filtra el
  -- volumen total de escaneos de la plataforma.
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_spot_id   uuid not null references public.event_spots (id)   on delete restrict,
  user_id         uuid not null,
  points_awarded  int  not null default 1,
  source          public.claim_source not null default 'qr',
  claimed_at      timestamptz not null default now(),

  -- Idempotencia: dos escaneos casi simultáneos del mismo QR no duplican.
  -- Es el mismo índice que se agregó en v1, ahora parte del esquema.
  unique (event_spot_id, user_id),

  -- No se puede reclamar sin estar registrado al evento. Lo garantiza la base,
  -- no depende de que la server action se acuerde de chequearlo.
  foreign key (event_id, user_id)
    references public.event_registrations (event_id, user_id)
    on delete cascade
);

create index spot_claims_event_time_idx on public.spot_claims (event_id, claimed_at desc);
create index spot_claims_user_event_idx on public.spot_claims (user_id, event_id);
create index spot_claims_spot_idx      on public.spot_claims (event_spot_id);

-- ---------------------------------------------------------------------------
-- raffles — configuración del sorteo
-- ---------------------------------------------------------------------------

create table public.raffles (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events (id)        on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null default 'Sorteo',
  status          public.raffle_status not null default 'draft',
  -- Elegibilidad: cuántas medallas hacen falta para entrar.
  min_claims      int  not null default 1,
  -- Excluye a todo el que trabaja en el evento (org, evento, expositores,
  -- platform admins). Configurable por si alguna org quiere lo contrario.
  exclude_staff   boolean not null default true,
  created_by      uuid references public.profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,

  constraint raffles_min_claims_positive check (min_claims >= 0)
);

create index raffles_event_idx on public.raffles (event_id);

create trigger raffles_set_updated_at
  before update on public.raffles
  for each row execute function app.set_updated_at();

-- ---------------------------------------------------------------------------
-- raffle_draws — cada extracción
--
-- Contra la `raffle_winners` de v1: permite varios premios por evento y permite
-- ANULAR sin borrar, que es lo que pasa siempre en la práctica (sale un nombre,
-- la persona no está, se vuelve a sortear).
-- ---------------------------------------------------------------------------

create table public.raffle_draws (
  id              uuid primary key default gen_random_uuid(),
  raffle_id       uuid not null references public.raffles (id)       on delete cascade,
  event_id        uuid not null references public.events (id)        on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id),
  prize_label     text,
  -- Congelado al momento del sorteo: el conteo puede cambiar después.
  claims_count    int  not null default 0,
  drawn_by        uuid not null references public.profiles (id),
  drawn_at        timestamptz not null default now(),
  voided_at       timestamptz,
  void_reason     text
);

-- Nadie gana dos veces el mismo sorteo — salvo que su extracción se anule, en
-- cuyo caso vuelve al bolillero.
create unique index raffle_draws_winner_unique
  on public.raffle_draws (raffle_id, user_id)
  where voided_at is null;

create index raffle_draws_event_idx on public.raffle_draws (event_id, drawn_at desc);
