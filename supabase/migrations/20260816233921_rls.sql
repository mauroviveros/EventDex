-- 008 — Row Level Security
--
-- Ver docs/04-rls.md para el razonamiento completo.
--
-- Dos reglas que se repiten en todo el archivo:
--   1. Toda llamada a función va envuelta en (select ...) para que Postgres la
--      evalúe UNA vez por query en vez de una por fila.
--   2. Toda columna que aparece en una política tiene índice (ver 002-006).

-- ===========================================================================
-- Habilitar RLS en todo. Una tabla con RLS activo y sin políticas devuelve
-- cero filas, que es el default correcto.
-- ===========================================================================

alter table public.profiles              enable row level security;
alter table public.platform_admins       enable row level security;
alter table public.organizations         enable row level security;
alter table public.organization_domains  enable row level security;
alter table public.organization_members  enable row level security;
alter table public.venues                enable row level security;
alter table public.spots                 enable row level security;
alter table public.event_series          enable row level security;
alter table public.events                enable row level security;
alter table public.event_schedules       enable row level security;
alter table public.event_members         enable row level security;
alter table public.event_spots           enable row level security;
alter table public.event_spot_exhibitors enable row level security;
alter table public.event_registrations   enable row level security;
alter table public.spot_claims           enable row level security;
alter table public.raffles               enable row level security;
alter table public.raffle_draws          enable row level security;
alter table public.event_invoices        enable row level security;
alter table public.audit_logs            enable row level security;

-- ===========================================================================
-- profiles
-- ===========================================================================

create policy profiles_select_self on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

-- Permite que el dashboard liste participantes sin service key — que es
-- exactamente lo que hace la v1 en getEventParticipants.
create policy profiles_select_org_peers on public.profiles
  for select to authenticated
  using (
    (select app.is_platform_admin())
    or exists (
      select 1 from public.event_registrations r
      where r.user_id = profiles.id and (select app.is_org_member(r.organization_id))
    )
    or exists (
      select 1 from public.organization_members m
      where m.user_id = profiles.id and (select app.is_org_member(m.organization_id))
    )
  );

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ===========================================================================
-- platform_admins — solo lectura, y solo entre ellos.
-- Darse acceso total a la plataforma no debe ser una acción de aplicación.
-- ===========================================================================

create policy platform_admins_select on public.platform_admins
  for select to authenticated
  using ((select app.is_platform_admin()));

-- ===========================================================================
-- organizations
-- ===========================================================================

create policy organizations_select_public on public.organizations
  for select to anon, authenticated
  using (status = 'active' and deleted_at is null);

create policy organizations_update_owner on public.organizations
  for update to authenticated
  using ((select app.is_org_owner(id)))
  with check ((select app.is_org_owner(id)));

-- ===========================================================================
-- organization_domains — el lookup de host es público (no revela nada que el
-- DNS no diga ya).
-- ===========================================================================

create policy organization_domains_select on public.organization_domains
  for select to anon, authenticated
  using (true);

create policy organization_domains_write on public.organization_domains
  for all to authenticated
  using ((select app.is_org_owner(organization_id)))
  with check ((select app.is_org_owner(organization_id)));

-- ===========================================================================
-- organization_members
--
-- ⚠️ Recursión: una política sobre esta tabla que consulte esta tabla cuelga.
-- Por eso los helpers app.* son security definer.
-- ===========================================================================

create policy organization_members_select on public.organization_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select app.is_org_member(organization_id))
    or (select app.is_platform_admin())
  );

create policy organization_members_write on public.organization_members
  for all to authenticated
  using ((select app.is_org_owner(organization_id)))
  with check ((select app.is_org_owner(organization_id)));

-- ===========================================================================
-- Catálogo: venues, spots, event_series
--
-- NO son públicos. Lo público es el spot del evento (event_spots) de un evento
-- publicado.
-- ===========================================================================

create policy venues_select on public.venues
  for select to authenticated
  using ((select app.is_org_member(organization_id)) or (select app.is_platform_admin()));

create policy venues_write_staff on public.venues
  for all to authenticated
  using ((select app.org_role(organization_id)) in ('owner', 'staff'))
  with check ((select app.org_role(organization_id)) in ('owner', 'staff'));

create policy spots_select on public.spots
  for select to authenticated
  using ((select app.is_org_member(organization_id)) or (select app.is_platform_admin()));

create policy spots_write_staff on public.spots
  for all to authenticated
  using ((select app.org_role(organization_id)) in ('owner', 'staff'))
  with check ((select app.org_role(organization_id)) in ('owner', 'staff'));

create policy event_series_select on public.event_series
  for select to authenticated
  using ((select app.is_org_member(organization_id)) or (select app.is_platform_admin()));

create policy event_series_write_staff on public.event_series
  for all to authenticated
  using ((select app.org_role(organization_id)) in ('owner', 'staff'))
  with check ((select app.org_role(organization_id)) in ('owner', 'staff'));

-- ===========================================================================
-- events
-- ===========================================================================

create policy events_select_public on public.events
  for select to anon, authenticated
  using (status = 'published' and visibility = 'public' and deleted_at is null);

create policy events_select_team on public.events
  for select to authenticated
  using ((select app.can_view_event(id)));

create policy events_insert_staff on public.events
  for insert to authenticated
  with check ((select app.org_role(organization_id)) in ('owner', 'staff'));

-- Un evento finalizado es historia: respalda escaneos que ya ocurrieron. En v1
-- este bloqueo vivía en requireEditableEvent() y era saltable llamando la
-- server action directo.
create policy events_update_team on public.events
  for update to authenticated
  using (
    (select app.can_edit_event(id))
    and (
      (select app.is_org_owner(organization_id))
      -- app.event_phase() y no la vista event_timeline: la vista lee `events`,
      -- así que consultarla acá dispararía esta misma política → recursión.
      or coalesce((select app.event_phase(id)) <> 'finished', true)
    )
  )
  with check ((select app.can_edit_event(id)));

-- Sin política de DELETE: la baja es UPDATE deleted_at, y la de arriba ya exige
-- can_edit_event. Restringir el borrado lógico al owner se hace con un trigger
-- (ver más abajo).

-- ===========================================================================
-- event_schedules — hereda el acceso de su evento
-- ===========================================================================

create policy event_schedules_select on public.event_schedules
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and e.status = 'published' and e.visibility = 'public' and e.deleted_at is null
    )
    or (select app.can_view_event(event_id))
  );

create policy event_schedules_write on public.event_schedules
  for all to authenticated
  using ((select app.can_edit_event(event_id)))
  with check ((select app.can_edit_event(event_id)));

-- ===========================================================================
-- event_members
-- ===========================================================================

create policy event_members_select on public.event_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select app.is_org_member(organization_id))
    or (select app.is_platform_admin())
  );

create policy event_members_write on public.event_members
  for all to authenticated
  using (
    (select app.org_role(organization_id)) in ('owner', 'staff')
    or (select app.event_role(event_id)) = 'manager'
  )
  with check (
    (select app.org_role(organization_id)) in ('owner', 'staff')
    or (select app.event_role(event_id)) = 'manager'
  );

-- ===========================================================================
-- event_spots
--
-- Que un QR de un spot inactivo o borrado no entregue medalla deja de ser una
-- regla de la aplicación (el .is("deleted_at", null) repetido de v1) y pasa a
-- ser invisibilidad a nivel base.
-- ===========================================================================

create policy event_spots_select_public on public.event_spots
  for select to anon, authenticated
  using (
    deleted_at is null
    and status = 'active'
    and exists (
      select 1 from public.events e
      where e.id = event_id
        and e.status = 'published' and e.visibility = 'public' and e.deleted_at is null
    )
  );

create policy event_spots_select_team on public.event_spots
  for select to authenticated
  using ((select app.can_view_event(event_id)) or (select app.is_event_exhibitor(id)));

create policy event_spots_write_staff on public.event_spots
  for all to authenticated
  using ((select app.can_edit_event(event_id)))
  with check ((select app.can_edit_event(event_id)));

-- El expositor solo puede tocar SUS filas: eso lo resuelve RLS.
create policy event_spots_update_exhibitor on public.event_spots
  for update to authenticated
  using ((select app.is_event_exhibitor(id)))
  with check ((select app.is_event_exhibitor(id)));

-- ⚠️ La restricción por COLUMNA no se puede hacer con GRANT en Supabase.
-- `grant update (col1, col2) ... to authenticated` se aplica al ROL de base de
-- datos, y en Supabase TODO usuario logueado es `authenticated`: el mismo grant
-- limitaría también al staff. Los grants de columna solo sirven cuando hay un
-- rol de Postgres por tipo de usuario, que no es el caso.
--
-- Por eso el límite de columnas lo hace el trigger de abajo, que sí puede
-- distinguir quién es quién.
create or replace function app.guard_exhibitor_columns()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- El staff pasa de largo.
  if app.can_edit_event(new.event_id) then
    return new;
  end if;

  if (new.code, new.booth, new.status, new.points, new.sort_order,
      new.spot_id, new.event_id, new.snapshot, new.deleted_at)
     is distinct from
     (old.code, old.booth, old.status, old.points, old.sort_order,
      old.spot_id, old.event_id, old.snapshot, old.deleted_at) then
    raise exception 'Un expositor solo puede editar nombre, descripción y avatar'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger event_spots_guard_exhibitor
  before update on public.event_spots
  for each row execute function app.guard_exhibitor_columns();

-- ===========================================================================
-- event_spot_exhibitors
-- ===========================================================================

create policy event_spot_exhibitors_select on public.event_spot_exhibitors
  for select to authenticated
  using (user_id = (select auth.uid()) or (select app.is_org_member(organization_id)));

create policy event_spot_exhibitors_write on public.event_spot_exhibitors
  for all to authenticated
  using ((select app.org_role(organization_id)) in ('owner', 'staff'))
  with check ((select app.org_role(organization_id)) in ('owner', 'staff'));

-- ===========================================================================
-- event_registrations
-- ===========================================================================

create policy event_registrations_select on public.event_registrations
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select app.is_org_member(organization_id))
    or (select app.is_platform_admin())
  );

-- El WITH CHECK es lo que impide registrarse a un evento en borrador.
create policy event_registrations_insert_self on public.event_registrations
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.events e
      where e.id = event_id
        and e.status = 'published' and e.visibility = 'public' and e.deleted_at is null
    )
  );

create policy event_registrations_update_staff on public.event_registrations
  for update to authenticated
  using ((select app.can_edit_event(event_id)))
  with check ((select app.can_edit_event(event_id)));

-- ===========================================================================
-- spot_claims — inmutables, y solo escribibles vía claim_spot()
-- ===========================================================================

create policy spot_claims_select on public.spot_claims
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select app.is_org_member(organization_id))
    or (select app.is_platform_admin())
  );

-- Sin políticas de INSERT/UPDATE/DELETE. Reclamar es una transacción con reglas
-- (¿evento en curso?, ¿spot activo?, ¿ya lo tenía?), así que se expone como
-- función security definer y no como INSERT libre.

-- ===========================================================================
-- raffles / raffle_draws
-- ===========================================================================

create policy raffles_select on public.raffles
  for select to authenticated
  using ((select app.is_org_member(organization_id)) or (select app.is_platform_admin()));

create policy raffles_write on public.raffles
  for all to authenticated
  using ((select app.can_edit_event(event_id)))
  with check ((select app.can_edit_event(event_id)));

-- Los ganadores se anuncian: lectura pública si el evento es público.
create policy raffle_draws_select_public on public.raffle_draws
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and e.status = 'published' and e.visibility = 'public' and e.deleted_at is null
    )
  );

-- Escritura solo vía draw_raffle() / void_draw().

-- ===========================================================================
-- event_invoices — la única tabla donde el developer escribe.
-- El staff ni la ve.
-- ===========================================================================

create policy event_invoices_select on public.event_invoices
  for select to authenticated
  using ((select app.is_org_owner(organization_id)) or (select app.is_platform_admin()));

create policy event_invoices_write_developer on public.event_invoices
  for all to authenticated
  using ((select app.is_developer()))
  with check ((select app.is_developer()));

-- ===========================================================================
-- audit_logs — append-only, escrito solo por funciones security definer
-- ===========================================================================

create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using ((select app.is_org_owner(organization_id)) or (select app.is_platform_admin()));

-- ===========================================================================
-- Baja lógica restringida al owner
-- ===========================================================================

create or replace function app.guard_soft_delete()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.deleted_at is null and new.deleted_at is not null
     and not app.is_org_owner(new.organization_id) then
    raise exception 'Solo el owner puede dar de baja' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger events_guard_soft_delete
  before update on public.events
  for each row execute function app.guard_soft_delete();

create trigger venues_guard_soft_delete
  before update on public.venues
  for each row execute function app.guard_soft_delete();

-- ===========================================================================
-- Privilegios base
--
-- RLS filtra filas, pero primero hace falta el GRANT. `anon` solo lee.
-- ===========================================================================

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update on
  public.profiles, public.organizations, public.organization_domains,
  public.organization_members, public.venues, public.spots, public.event_series,
  public.events, public.event_schedules, public.event_members,
  public.event_spot_exhibitors, public.event_registrations,
  public.raffles, public.event_invoices, public.event_spots
  to authenticated;

grant execute on function
  public.resolve_organization(text),
  public.resolve_active_event(uuid),
  public.claim_spot(uuid),
  public.publish_event(uuid),
  public.duplicate_event(uuid, text, text, int, boolean, boolean),
  public.raffle_eligible(uuid),
  public.draw_raffle(uuid, text),
  public.void_draw(uuid, text),
  -- Guard de platform admin adentro de la función.
  public.platform_visitor_stats(uuid)
  to authenticated;

grant execute on function
  public.resolve_organization(text),
  public.resolve_active_event(uuid)
  to anon;
