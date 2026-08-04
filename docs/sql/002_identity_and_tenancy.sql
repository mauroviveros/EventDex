-- 002 — Identidad y tenancy
--
-- profiles, platform_admins, organizations, organization_domains,
-- organization_members.

-- ---------------------------------------------------------------------------
-- profiles — espejo de auth.users
-- ---------------------------------------------------------------------------

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        citext      not null,
  full_name    text        not null default '',
  display_name text,
  avatar_url   text,
  locale       text        not null default 'es-AR',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);

-- Se eliminan respecto de v1: `initials` (derivable, se calcula en la UI) y
-- `username` (nunca se usó).

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function app.set_updated_at();

-- Alta automática del perfil en el signup. Corre con los privilegios del
-- definidor porque el usuario todavía no tiene sesión.
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

-- ---------------------------------------------------------------------------
-- platform_admins — el rol "developer"
--
-- Tabla propia y no un valor de organization_role: el acceso es
-- cross-organización. Ver docs/adr/0004-modelo-de-roles.md
-- ---------------------------------------------------------------------------

create table public.platform_admins (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  level      public.platform_role not null default 'developer',
  notes      text,
  granted_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------

create table public.organizations (
  id               uuid primary key default gen_random_uuid(),
  slug             citext not null unique,
  name             text   not null,
  legal_name       text,
  logo_path        text,
  -- Colores, tipografías, tema. Reemplaza la columna `events.config` de v1,
  -- que nunca se usó.
  brand            jsonb  not null default '{}'::jsonb,
  default_timezone text   not null default 'America/Argentina/Buenos_Aires',
  status           public.organization_status not null default 'active',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz,
  deleted_at       timestamptz,

  constraint organizations_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$')
);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function app.set_updated_at();

-- ---------------------------------------------------------------------------
-- organization_domains — resolución multi-tenant por host
--
-- Reemplaza EVENTDEX_ORGANIZATION_ID. Un deployment sirve a todas las orgs.
-- ---------------------------------------------------------------------------

create table public.organization_domains (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid   not null references public.organizations (id) on delete cascade,
  hostname        citext not null unique,
  is_primary      boolean not null default false,
  verified_at     timestamptz,
  created_at      timestamptz not null default now()
);

-- Un solo dominio canónico por organización.
create unique index organization_domains_one_primary
  on public.organization_domains (organization_id)
  where is_primary;

create index organization_domains_org_idx
  on public.organization_domains (organization_id);

-- ---------------------------------------------------------------------------
-- organization_members
-- ---------------------------------------------------------------------------

create table public.organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id)      on delete cascade,
  role            public.organization_role   not null,
  status          public.membership_status   not null default 'active',
  invited_by      uuid references public.profiles (id),
  joined_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,

  unique (organization_id, user_id)
);

-- Índice para RLS: la pregunta caliente es "¿este usuario pertenece a esta org?".
create index organization_members_user_org_idx
  on public.organization_members (user_id, organization_id)
  where status = 'active';

create trigger organization_members_set_updated_at
  before update on public.organization_members
  for each row execute function app.set_updated_at();

-- Invariante: una organización nunca se queda sin owners activos.
-- Se hace cumplir acá y no en la interfaz porque la interfaz se puede saltear.
create or replace function app.prevent_last_owner_removal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := coalesce(old.organization_id, new.organization_id);
  v_remaining int;
begin
  -- Solo interesa cuando se pierde un owner activo.
  if tg_op = 'UPDATE'
     and old.role = 'owner' and old.status = 'active'
     and new.role = 'owner' and new.status = 'active' then
    return new;
  end if;

  if old.role <> 'owner' or old.status <> 'active' then
    return coalesce(new, old);
  end if;

  select count(*) into v_remaining
  from public.organization_members
  where organization_id = v_org
    and role = 'owner'
    and status = 'active'
    and id <> old.id;

  if v_remaining = 0 then
    raise exception 'La organización debe conservar al menos un owner activo';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger organization_members_keep_owner
  before update or delete on public.organization_members
  for each row execute function app.prevent_last_owner_removal();
