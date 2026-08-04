-- 007 — Helpers de autorización, vistas y funciones de negocio

-- ===========================================================================
-- Helpers de autorización (esquema app)
--
-- Todos `security definer` + `stable` + `set search_path = ''`:
--   · security definer  → no disparan RLS recursivo al consultar membresías
--   · stable            → Postgres los cachea dentro de la query
--   · search_path = ''  → un esquema malicioso en el path no los puede secuestrar
-- ===========================================================================

create or replace function app.current_user_id()
returns uuid language sql stable set search_path = '' as $$
  select auth.uid();
$$;

create or replace function app.is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.platform_admins where user_id = (select auth.uid())
  );
$$;

create or replace function app.is_developer()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.platform_admins
    where user_id = (select auth.uid()) and level = 'developer'
  );
$$;

create or replace function app.org_role(p_org uuid)
returns public.organization_role language sql stable security definer set search_path = '' as $$
  select role from public.organization_members
  where organization_id = p_org
    and user_id = (select auth.uid())
    and status = 'active'
  limit 1;
$$;

create or replace function app.is_org_member(p_org uuid)
returns boolean language sql stable set search_path = '' as $$
  select app.org_role(p_org) is not null;
$$;

create or replace function app.is_org_owner(p_org uuid)
returns boolean language sql stable set search_path = '' as $$
  select app.org_role(p_org) = 'owner';
$$;

create or replace function app.event_role(p_event uuid)
returns public.event_role language sql stable security definer set search_path = '' as $$
  select role from public.event_members
  where event_id = p_event and user_id = (select auth.uid())
  limit 1;
$$;

-- Puede VER el evento aunque esté en borrador.
create or replace function app.can_view_event(p_event uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select
    app.is_platform_admin()
    or exists (
      select 1 from public.events e
      where e.id = p_event and app.is_org_member(e.organization_id)
    )
    or app.event_role(p_event) is not null;
$$;

-- Puede EDITAR el contenido del evento. Regla: gana el permiso más alto.
create or replace function app.can_edit_event(p_event uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select
    exists (
      select 1 from public.events e
      where e.id = p_event and app.org_role(e.organization_id) in ('owner', 'staff')
    )
    or app.event_role(p_event) in ('manager', 'staff');
$$;

create or replace function app.is_event_exhibitor(p_event_spot uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.event_spot_exhibitors
    where event_spot_id = p_event_spot
      and user_id = (select auth.uid())
      and can_edit
  );
$$;

-- Fase temporal del evento, como helper security definer.
--
-- No se consulta la vista `event_timeline` desde una política de `events`:
-- la vista lee `events`, así que evaluar la política dispararía la política de
-- nuevo → recursión infinita. Con security definer la lectura interna no pasa
-- por RLS y el ciclo se corta.
create or replace function app.event_phase(p_event uuid)
returns public.event_phase language sql stable security definer set search_path = '' as $$
  select
    case
      when now() <  min(s.starts_at) then 'upcoming'::public.event_phase
      when now() >  max(s.ends_at)   then 'finished'::public.event_phase
      else                                'live'::public.event_phase
    end
  from public.event_schedules s
  where s.event_id = p_event
  having count(*) > 0;
$$;

create or replace function app.is_registered(p_event uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.event_registrations
    where event_id = p_event
      and user_id = (select auth.uid())
      and status = 'active'
  );
$$;

-- ===========================================================================
-- Vistas
--
-- `security_invoker = true` en todas: sin eso, una vista corre con los permisos
-- de quien la creó y es un agujero silencioso en el RLS.
-- ===========================================================================

-- La FASE del evento. Nunca se guarda: se calcula desde las jornadas.
-- El rango va de la PRIMERA jornada al fin de la ÚLTIMA, no jornada por
-- jornada: un evento de sábado y domingo no debe figurar como terminado el
-- sábado a la noche.
create or replace view public.event_timeline
with (security_invoker = true) as
select
  e.id              as event_id,
  e.organization_id,
  min(s.starts_at)  as starts_at,
  max(s.ends_at)    as ends_at,
  case
    when now() <  min(s.starts_at) then 'upcoming'::public.event_phase
    when now() >  max(s.ends_at)   then 'finished'::public.event_phase
    else                                'live'::public.event_phase
  end as phase
from public.events e
join public.event_schedules s on s.event_id = e.id
group by e.id, e.organization_id;

-- Spot del evento con la regla de resolución ya aplicada.
-- Ver docs/adr/0003-spots-reutilizables.md
create or replace view public.event_spots_resolved
with (security_invoker = true) as
select
  es.id,
  es.event_id,
  es.organization_id,
  es.spot_id,
  es.code,
  es.booth,
  es.status,
  es.points,
  es.sort_order,
  es.deleted_at,
  coalesce(es.name_override,        es.snapshot ->> 'name',        s.name)        as name,
  coalesce(es.description_override, es.snapshot ->> 'description', s.description) as description,
  coalesce(es.avatar_path_override, es.snapshot ->> 'avatar_path', s.avatar_path) as avatar_path,
  coalesce((es.snapshot ->> 'type')::public.spot_type, s.type)                    as type
from public.event_spots es
join public.spots s on s.id = es.spot_id;

-- Columnas públicas de la organización. Evita tener que usar la service key
-- para leer el nombre en la metadata, que es lo que hace la v1.
create or replace view public.public_organizations
with (security_invoker = true) as
select id, slug, name, logo_path, brand, default_timezone
from public.organizations
where status = 'active' and deleted_at is null;

-- Cohortes de visitantes: quién es nuevo para la organización y quién vuelve.
--
-- No se guarda en columnas porque es derivable y las columnas derivadas se
-- desincronizan. El costo es una window function sobre unos pocos miles de
-- filas por evento, que con el índice (user_id, registered_at) es trivial.
--
-- `row_number()` y no `min(registered_at)`: si dos registros de un mismo usuario
-- comparten timestamp exacto, `min()` marcaría los dos como "primero".
--
-- ⚠️ Esta vista es `security_invoker`, así que la window function solo ve las
-- filas que RLS le deja ver a quien consulta. Por eso TODAS las particiones
-- incluyen `organization_id`: un miembro de la org ve el 100% de los registros
-- de su organización, así que el cálculo es exacto. Una métrica particionada
-- solo por `user_id` (¿es nuevo en toda la plataforma?) daría MAL acá, porque
-- las filas de otras organizaciones están filtradas — esa vive abajo, en
-- `app.platform_visitor_stats()`, restringida a platform admins.
create or replace view public.event_visitor_cohorts
with (security_invoker = true) as
select
  r.id,
  r.event_id,
  r.organization_id,
  r.user_id,
  r.registered_at,
  r.source,

  -- Primera vez en ESTA organización. Es la métrica que importa para el
  -- organizador: "cuántos de los que vinieron son gente nueva para nosotros".
  row_number() over (
    partition by r.user_id, r.organization_id order by r.registered_at, r.id
  ) = 1 as is_first_org_visit,

  -- A cuántas ediciones previas de esta organización ya había venido.
  (row_number() over (
    partition by r.user_id, r.organization_id order by r.registered_at, r.id
  ) - 1) as previous_org_events
from public.event_registrations r
where r.status = 'active';

-- Resumen por evento: la fila que va al dashboard.
create or replace view public.event_visitor_stats
with (security_invoker = true) as
select
  c.event_id,
  c.organization_id,
  count(*)                                          as registrations,
  count(*) filter (where c.is_first_org_visit)      as new_visitors,
  count(*) filter (where not c.is_first_org_visit)  as returning_visitors,
  -- Cuántos se registraron escaneando un QR vs. desde la landing.
  count(*) filter (where c.source = 'qr')           as via_qr,
  count(*) filter (where c.source = 'landing')      as via_landing
from public.event_visitor_cohorts c
group by c.event_id, c.organization_id;

-- Métrica cross-organización: cuánta gente es nueva en TODA la plataforma.
--
-- Es una función security definer y no una columna de la vista de arriba por dos
-- razones: (1) bajo security_invoker el cálculo sería incorrecto, porque la
-- window function no vería las filas de otras organizaciones; (2) saber que un
-- visitante ya asistió a un evento de otro cliente es información cross-tenant
-- que el staff de una organización no debería ver.
-- Vive en `public` y no en `app` porque el panel de plataforma tiene que poder
-- invocarla: Supabase solo expone `public` vía PostgREST. El guard va adentro.
create or replace function public.platform_visitor_stats(p_event_id uuid)
returns table (registrations bigint, new_to_platform bigint, seen_before bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not app.is_platform_admin() then
    raise exception 'Sin permisos' using errcode = '42501';
  end if;

  return query
  with ranked as (
    select r.event_id,
           row_number() over (partition by r.user_id order by r.registered_at, r.id) = 1
             as is_first_platform_visit
    from public.event_registrations r
    where r.status = 'active'
  )
  select count(*),
         count(*) filter (where ranked.is_first_platform_visit),
         count(*) filter (where not ranked.is_first_platform_visit)
  from ranked
  where ranked.event_id = p_event_id;
end;
$$;

-- Métricas por evento, en una sola pasada.
create or replace view public.event_stats
with (security_invoker = true) as
select
  e.id as event_id,
  e.organization_id,
  (select count(*) from public.event_spots es
     where es.event_id = e.id and es.deleted_at is null and es.status = 'active') as active_spots,
  (select count(*) from public.event_registrations r
     where r.event_id = e.id and r.status = 'active')                              as registrations,
  (select count(*) from public.spot_claims c where c.event_id = e.id)              as claims,
  (select count(distinct c.user_id) from public.spot_claims c where c.event_id = e.id) as participants
from public.events e;

-- ===========================================================================
-- Funciones de negocio
-- ===========================================================================

-- Host → organización. Reemplaza EVENTDEX_ORGANIZATION_ID.
create or replace function public.resolve_organization(p_hostname text)
returns uuid language sql stable security definer set search_path = '' as $$
  select d.organization_id
  from public.organization_domains d
  join public.organizations o on o.id = d.organization_id
  where d.hostname = p_hostname::citext
    and o.status = 'active'
    and o.deleted_at is null
  limit 1;
$$;

-- Cuál evento muestra la app: en curso → próximo → último terminado.
-- En v1 esto era pickActiveEvent() en JavaScript, trayendo TODOS los eventos
-- publicados de la organización con sus jornadas para ordenarlos en memoria.
create or replace function public.resolve_active_event(p_organization_id uuid)
returns uuid language sql stable set search_path = '' as $$
  select t.event_id
  from public.event_timeline t
  join public.events e on e.id = t.event_id
  where e.organization_id = p_organization_id
    and e.status = 'published'
    and e.visibility = 'public'
    and e.deleted_at is null
  order by
    case t.phase
      when 'live'     then 0
      when 'upcoming' then 1
      else                 2
    end,
    -- Entre los próximos, el que arranca antes.
    case when t.phase = 'upcoming' then t.starts_at end asc  nulls last,
    -- Entre los terminados, el que terminó último.
    case when t.phase = 'finished' then t.ends_at   end desc nulls last,
    -- Entre los que están en curso, el que arrancó primero.
    t.starts_at asc
  limit 1;
$$;

-- Reclamo de medalla: registro + reclamo, atómico e idempotente.
--
-- En v1, collectMedal hace un SELECT y después un INSERT, y la carrera la cierra
-- el índice único. Acá es una sola sentencia.
create or replace function public.claim_spot(p_event_spot_id uuid)
returns table (registered boolean, claimed boolean, total_claims bigint)
language plpgsql security definer set search_path = '' as $$
declare
  v_user    uuid := (select auth.uid());
  v_spot    record;
  v_phase   public.event_phase;
  v_claimed boolean := false;
begin
  if v_user is null then
    raise exception 'Se requiere sesión para reclamar' using errcode = '42501';
  end if;

  -- El spot tiene que estar vivo, activo, y su evento publicado y público.
  select es.id, es.event_id, es.organization_id, es.points
    into v_spot
  from public.event_spots es
  join public.events e on e.id = es.event_id
  where es.id = p_event_spot_id
    and es.deleted_at is null
    and es.status = 'active'
    and e.status = 'published'
    and e.visibility = 'public'
    and e.deleted_at is null;

  if not found then
    raise exception 'Spot no disponible' using errcode = 'P0002';
  end if;

  -- Solo se reclama con el evento en curso. En v1 esto no se validaba: un QR
  -- fotografiado se podía reclamar dos días antes.
  v_phase := app.event_phase(v_spot.event_id);
  if v_phase is distinct from 'live' then
    raise exception 'El evento no está en curso' using errcode = 'P0003';
  end if;

  insert into public.event_registrations (event_id, organization_id, user_id, source)
  values (v_spot.event_id, v_spot.organization_id, v_user, 'qr')
  on conflict (event_id, user_id) do nothing;

  insert into public.spot_claims
    (event_id, organization_id, event_spot_id, user_id, points_awarded, source)
  values
    (v_spot.event_id, v_spot.organization_id, p_event_spot_id, v_user, v_spot.points, 'qr')
  on conflict (event_spot_id, user_id) do nothing;

  get diagnostics v_claimed = row_count;

  return query
    select true,
           v_claimed,
           (select count(*) from public.spot_claims c
             where c.event_id = v_spot.event_id and c.user_id = v_user);
end;
$$;

-- Publicar no es un UPDATE status: valida y congela los snapshots.
create or replace function public.publish_event(p_event_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from public.events where id = p_event_id;
  if v_org is null then
    raise exception 'Evento inexistente' using errcode = 'P0002';
  end if;
  if not app.can_edit_event(p_event_id) then
    raise exception 'Sin permisos' using errcode = '42501';
  end if;

  if not exists (select 1 from public.event_schedules where event_id = p_event_id) then
    raise exception 'El evento necesita al menos una jornada';
  end if;
  if not exists (
    select 1 from public.event_spots
    where event_id = p_event_id and deleted_at is null and status = 'active'
  ) then
    raise exception 'El evento necesita al menos un spot activo';
  end if;

  -- Congela el estado actual del catálogo. Es lo que hace que renombrar un spot
  -- en 2027 no reescriba la historia de la edición 2026.
  update public.event_spots es
     set snapshot = jsonb_build_object(
           'name',        s.name,
           'description', s.description,
           'avatar_path', s.avatar_path,
           'type',        s.type,
           'frozen_at',   now()
         )
    from public.spots s
   where s.id = es.spot_id
     and es.event_id = p_event_id
     and es.deleted_at is null;

  update public.events
     set status = 'published', published_at = coalesce(published_at, now())
   where id = p_event_id;

  perform app.audit(v_org, 'event.published', 'event', p_event_id, null);
end;
$$;

-- Republicar como una edición nueva. Copia la configuración y los spots;
-- NO copia jornadas, registros, reclamos ni sorteos.
create or replace function public.duplicate_event(
  p_source_event_id uuid,
  p_slug            text,
  p_edition_label   text default null,
  p_edition_number  int  default null,
  p_copy_spots      boolean default true,
  p_copy_members    boolean default true
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_new uuid;
  v_org uuid;
begin
  if not app.can_edit_event(p_source_event_id) then
    raise exception 'Sin permisos' using errcode = '42501';
  end if;

  insert into public.events (
    organization_id, series_id, venue_id, slug, title, edition_label, edition_number,
    summary, description, cover_path, timezone, settings, status, visibility, created_by
  )
  select organization_id, series_id, venue_id, p_slug, title, p_edition_label, p_edition_number,
         summary, description, cover_path, timezone, settings, 'draft', visibility, (select auth.uid())
  from public.events where id = p_source_event_id
  returning id, organization_id into v_new, v_org;

  if p_copy_spots then
    -- Apunta a los MISMOS spots del catálogo, no a copias. Esa es toda la
    -- ventaja de haber sacado el spot de adentro del evento.
    insert into public.event_spots
      (event_id, organization_id, spot_id, code, booth, points, sort_order, status)
    select v_new, organization_id, spot_id, code, booth, points, sort_order, status
    from public.event_spots
    where event_id = p_source_event_id and deleted_at is null;
  end if;

  if p_copy_members then
    insert into public.event_members (event_id, organization_id, user_id, role)
    select v_new, organization_id, user_id, role
    from public.event_members where event_id = p_source_event_id;
  end if;

  perform app.audit(v_org, 'event.duplicated', 'event', v_new,
                    jsonb_build_object('source', p_source_event_id));
  return v_new;
end;
$$;

-- Participantes elegibles de un sorteo. Centraliza la exclusión del staff, que
-- en v1 estaba repartida entre getOrganizerUserIds() y filtros en el cliente.
create or replace function public.raffle_eligible(p_raffle_id uuid)
returns table (user_id uuid, claims_count bigint)
language sql stable security definer set search_path = '' as $$
  with r as (select * from public.raffles where id = p_raffle_id)
  select c.user_id, count(*) as claims_count
  from public.spot_claims c
  join r on r.event_id = c.event_id
  join public.event_registrations reg
    on reg.event_id = c.event_id and reg.user_id = c.user_id and reg.status = 'active'
  where not (
    r.exclude_staff and (
      exists (select 1 from public.organization_members m
               where m.organization_id = r.organization_id and m.user_id = c.user_id)
      or exists (select 1 from public.event_members em
                  where em.event_id = r.event_id and em.user_id = c.user_id)
      or exists (select 1 from public.platform_admins pa where pa.user_id = c.user_id)
    )
  )
  group by c.user_id, r.min_claims
  having count(*) >= r.min_claims;
$$;

-- El ganador lo elige la BASE, no el navegador. En v1 el sorteo se resolvía en
-- el cliente y después se persistía el resultado.
create or replace function public.draw_raffle(p_raffle_id uuid, p_prize_label text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_raffle record;
  v_winner record;
  v_draw   uuid;
begin
  select * into v_raffle from public.raffles where id = p_raffle_id;
  if v_raffle is null then
    raise exception 'Sorteo inexistente' using errcode = 'P0002';
  end if;
  if not app.can_edit_event(v_raffle.event_id) then
    raise exception 'Sin permisos' using errcode = '42501';
  end if;

  select e.user_id, e.claims_count into v_winner
  from public.raffle_eligible(p_raffle_id) e
  where not exists (
    select 1 from public.raffle_draws d
    where d.raffle_id = p_raffle_id and d.user_id = e.user_id and d.voided_at is null
  )
  order by random()
  limit 1;

  if v_winner is null then
    raise exception 'No hay participantes elegibles';
  end if;

  insert into public.raffle_draws
    (raffle_id, event_id, organization_id, user_id, prize_label, claims_count, drawn_by)
  values
    (p_raffle_id, v_raffle.event_id, v_raffle.organization_id,
     v_winner.user_id, p_prize_label, v_winner.claims_count, (select auth.uid()))
  returning id into v_draw;

  perform app.audit(v_raffle.organization_id, 'raffle.drawn', 'raffle_draw', v_draw,
                    jsonb_build_object('winner', v_winner.user_id));
  return v_draw;
end;
$$;

-- Anular una extracción: el ganador vuelve al bolillero.
create or replace function public.void_draw(p_draw_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_draw record;
begin
  select * into v_draw from public.raffle_draws where id = p_draw_id;
  if v_draw is null or not app.can_edit_event(v_draw.event_id) then
    raise exception 'Sin permisos' using errcode = '42501';
  end if;

  update public.raffle_draws
     set voided_at = now(), void_reason = p_reason
   where id = p_draw_id and voided_at is null;

  perform app.audit(v_draw.organization_id, 'raffle.voided', 'raffle_draw', p_draw_id,
                    jsonb_build_object('reason', p_reason));
end;
$$;
