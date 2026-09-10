-- Verificación de PERMISOS: quién ve qué, y quién puede escribir qué.
--
-- El hermano de verify.sql. Aquel verifica la FORMA del esquema (RLS activo,
-- vistas con security_invoker, políticas presentes); este verifica su
-- COMPORTAMIENTO: se pone en los zapatos de cada rol y le pregunta a la base.
--
-- ---------------------------------------------------------------------------
-- Cómo se corre
-- ---------------------------------------------------------------------------
--
-- Pegándolo entero en el SQL Editor del dashboard, o con psql:
--
--   pnpm db:test
--
-- Todos los controles se acumulan en `tests.results` y el archivo termina con
-- UN SOLO `select`. Es a propósito: el SQL Editor muestra el resultado de una
-- sola sentencia cuando corrés varias, así que treinta `select` sueltos ahí no
-- servirían de nada. La columna `fallas_totales` es la que hay que mirar
-- primero; si da 0, todos los controles pasaron.
--
-- ⚠️ Todo ocurre dentro de un begin/rollback: cuando termina no queda una sola
-- fila de las que creó. Por eso acá SÍ se crean usuarios, a diferencia del
-- seed: no persiste ninguna credencial porque no persiste ninguna fila. Nacen
-- sin `encrypted_password` (no hay login posible) y con emails en el TLD
-- .invalid (RFC 2606), que no resuelve ni puede recibir mail.
--
-- Si el editor devuelve "Success. No rows returned" en vez de la tabla, es
-- porque mostró el resultado del `rollback` final y no el del `select`. En ese
-- caso: comentá la línea `rollback;`, corré de nuevo para ver el informe, y
-- después corré el bloque de limpieza que está al final del archivo.
--
-- ---------------------------------------------------------------------------
-- Qué NO es
-- ---------------------------------------------------------------------------
--
-- No usa pgTAP a propósito: no hay framework nuevo que aprender, es el mismo
-- SQL de las migraciones. Lo que se pierde es el verde/rojo automático — este
-- archivo no avisa solo cuando una migración futura rompe una política, hay que
-- acordarse de correrlo. El día que se quiera automatizar, el fixture de acá se
-- reusa tal cual y solo hay que envolver los controles en assertions.

begin;

-- ===========================================================================
-- 0 — Andamiaje
--
-- Un esquema propio para no ensuciar `public` ni siquiera dentro de la
-- transacción. Se va con el rollback junto con todo lo demás.
-- ===========================================================================

create schema tests;

-- Los ids del fixture. Hace falta una tabla y no variables de plpgsql porque
-- las consultas de más abajo son sentencias sueltas, fuera del bloque que las
-- crea.
create table tests.ids (key text primary key, id uuid not null);

create function tests.id(p_key text) returns uuid
language sql stable as $fn$
  select id from tests.ids where key = p_key;
$fn$;

-- El informe. `momento` con clock_timestamp() y no un serial: avanza aunque
-- estemos dentro de una transacción, y así no hace falta darle permisos de
-- secuencia a los roles que escriben acá mientras están impersonados.
create table tests.results (
  momento   timestamptz not null default clock_timestamp(),
  seccion   text not null,
  control   text not null,
  esperado  text not null,
  obtenido  text not null,
  veredicto text not null
);

create function tests.check(
  p_seccion text, p_control text, p_esperado text, p_obtenido text
) returns void language plpgsql as $fn$
declare v_ok boolean;
begin
  v_ok := case
    -- '>0' es el gemelo positivo: no importa cuántas filas, importa que no sea
    -- cero. Un cero puede significar "la política funciona" o "la política está
    -- tan cerrada que no devuelve nada nunca", y el segundo también es un bug.
    when p_esperado = '>0' then
      -- CASE anidado y no `regex and cast`: Postgres no garantiza cortocircuito
      -- en un AND, así que el cast podría evaluarse igual sobre un texto de
      -- error y reventar. CASE sí garantiza el orden.
      case when coalesce(p_obtenido, '') ~ '^\d+$'
           then p_obtenido::bigint > 0
           else false end
    else p_obtenido is not distinct from p_esperado
  end;

  insert into tests.results (seccion, control, esperado, obtenido, veredicto)
  values (p_seccion, p_control, p_esperado, p_obtenido,
          case when v_ok then 'OK' else 'FALLA <<<' end);
end;
$fn$;

-- Corre una query escalar y compara su resultado.
create function tests.check_query(
  p_seccion text, p_control text, p_esperado text, p_sql text
) returns void language plpgsql as $fn$
declare v text;
begin
  execute p_sql into v;
  perform tests.check(p_seccion, p_control, p_esperado, coalesce(v, '(null)'));
exception when others then
  -- El sqlstate se guarda para distinguir un rechazo legítimo de la base de un
  -- error tonto en la query de prueba (42P01 tabla inexistente, 42703 columna).
  perform tests.check(p_seccion, p_control, p_esperado,
                      format('error [%s] %s', sqlstate, sqlerrm));
end;
$fn$;

-- Corre una sentencia que la base TIENE que rechazar.
--
-- Distingue los dos "no" posibles, que son distintos y se confunden fácil:
--   · una excepción (un trigger, un check, un grant faltante) → ruidoso;
--   · el silencio de RLS → la política no matchea ninguna fila y el UPDATE
--     afecta 0 filas sin error. Es el caso peligroso, porque desde la app
--     parece que "no pasó nada".
-- Cualquiera de los dos cuenta como OK; lo que no cuenta es que se haya
-- modificado una fila.
create function tests.denied(p_seccion text, p_control text, p_sql text)
returns void language plpgsql as $fn$
declare n bigint; v_obtenido text; v_ok boolean;
begin
  -- Bloque interno: si la sentencia lanza, plpgsql revierte hasta acá. El
  -- registro en tests.results va DESPUÉS, en el bloque de afuera, para que
  -- sobreviva a esa reversión.
  begin
    execute p_sql;
    get diagnostics n = row_count;
    if n = 0 then
      v_obtenido := 'rechazado (RLS no expuso ninguna fila)'; v_ok := true;
    else
      v_obtenido := format('PERMITIDO: %s fila(s)', n);      v_ok := false;
    end if;
  exception when others then
    -- El sqlstate queda a la vista: 42501 es un rechazo legítimo, 42P01 o 42703
    -- serían un error de tipeo en la sentencia de prueba.
    v_obtenido := format('rechazado [%s]', sqlstate);        v_ok := true;
  end;

  -- Escribe su propio veredicto en vez de pasar por tests.check: si comparara
  -- textos habría que normalizar el `obtenido` a 'rechazado' y se perdería
  -- justamente el detalle que interesa.
  insert into tests.results (seccion, control, esperado, obtenido, veredicto)
  values (p_seccion, p_control, 'rechazado', v_obtenido,
          case when v_ok then 'OK' else 'FALLA <<<' end);
end;
$fn$;

-- El gemelo del anterior. Sin este, una política rota hacia el lado restrictivo
-- (no deja hacer nada a nadie) pasaría todos los controles.
create function tests.allowed(p_seccion text, p_control text, p_sql text)
returns void language plpgsql as $fn$
declare n bigint; v_obtenido text; v_ok boolean;
begin
  begin
    execute p_sql;
    get diagnostics n = row_count;
    if n > 0 then
      v_obtenido := format('permitido (%s fila/s)', n); v_ok := true;
    else
      v_obtenido := 'BLOQUEADO (0 filas)';              v_ok := false;
    end if;
  exception when others then
    v_obtenido := format('BLOQUEADO [%s] %s', sqlstate, sqlerrm); v_ok := false;
  end;

  insert into tests.results (seccion, control, esperado, obtenido, veredicto)
  values (p_seccion, p_control, 'permitido', v_obtenido,
          case when v_ok then 'OK' else 'FALLA <<<' end);
end;
$fn$;

-- Cuenta filas de una organización en cualquier tabla o vista.
--
-- NO es security definer, a propósito: tiene que correr con los privilegios de
-- quien la llama para que RLS filtre. Una versión security definer devolvería
-- siempre el total y todos los controles darían verde.
create function tests.count_rows_of(p_relation text, p_org uuid) returns bigint
language plpgsql as $fn$
declare n bigint;
begin
  execute format('select count(*) from public.%I where organization_id = $1', p_relation)
  into n using p_org;
  return n;
end;
$fn$;

-- Cambia el contexto de la sesión al de un usuario logueado.
--
-- Son las dos únicas cosas que hacen falta para "ser" alguien:
--   · el claim `sub` es lo que devuelve auth.uid(), del que cuelgan todos los
--     helpers app.*;
--   · el rol `authenticated` es lo que hace que las políticas `to authenticated`
--     apliquen. Sin el claim `role`, auth.role() miente.
--
-- set_config(..., true) equivale a SET LOCAL: dura hasta el fin de la
-- transacción. Es el mismo mecanismo que ya usa seed.sql para llamar a
-- publish_event() como si fuera el owner.
create function tests.authenticate_as(p_user uuid) returns void
language plpgsql as $fn$
begin
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', p_user, 'role', 'authenticated')::text,
    true
  );
  -- Va por EXECUTE para no depender de cómo plpgsql interpreta un SET escrito
  -- directo en el cuerpo.
  execute 'set local role authenticated';
end;
$fn$;

create function tests.as_anon() returns void
language plpgsql as $fn$
begin
  perform set_config('request.jwt.claims', '', true);
  execute 'set local role anon';
end;
$fn$;

-- Vuelve a postgres. RLS no aplica, que es lo que hace falta para armar el
-- fixture con datos de las dos organizaciones sin pelearse con las políticas
-- que justamente se están por probar.
create function tests.as_superuser() returns void
language plpgsql as $fn$
begin
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';
end;
$fn$;

-- Crea un usuario de Auth. Sin password: no hay forma de iniciar sesión con él,
-- y de todos modos el rollback se lo lleva.
--
-- ⚠️ `auth.users` no es nuestra: la forma cambia entre versiones de GoTrue. Las
-- cuatro columnas de token van en '' porque son `not null` sin default. Si esto
-- falla después de un upgrade de Supabase, comparar con `\d auth.users`.
create function tests.create_user(p_email text, p_name text) returns uuid
language plpgsql as $fn$
declare v_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', p_email,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_name),
    now(), now(),
    '', '', '', ''
  );
  -- El trigger on_auth_user_created ya creó el profile.
  return v_id;
end;
$fn$;

grant usage  on schema tests            to anon, authenticated;
grant select on tests.ids               to anon, authenticated;
grant insert on tests.results           to anon, authenticated;

-- ===========================================================================
-- 1 — Fixture
--
-- Dos organizaciones. La A es el mundo normal: evento publicado y en curso,
-- con owner, staff, expositor y visitantes. La B queda ENTERA en privado (su
-- evento nunca se publica), así que cualquier fila suya que se filtre hacia la
-- A es un hueco, sin excepciones que discutir.
-- ===========================================================================

do $fixture$
declare
  v_org_a uuid; v_org_b uuid;
  v_owner_a uuid; v_staff_a uuid; v_exhibitor_a uuid;
  v_visitor_a uuid; v_visitor_a2 uuid;
  v_owner_b uuid; v_visitor_b uuid; v_dev uuid;
  v_venue_a uuid; v_venue_b uuid;
  v_series_a uuid; v_series_b uuid;
  v_event_a uuid; v_event_b uuid;
  v_spot_a1 uuid; v_spot_a2 uuid; v_spot_a3 uuid; v_spot_b uuid;
  v_es_a1 uuid; v_es_a2 uuid; v_es_a3 uuid; v_es_b uuid;
  v_raffle_a uuid; v_raffle_b uuid;
begin
  -- Usuarios ---------------------------------------------------------------
  v_owner_a     := tests.create_user('owner-a@eventdex.invalid',     'Owner A');
  v_staff_a     := tests.create_user('staff-a@eventdex.invalid',     'Staff A');
  v_exhibitor_a := tests.create_user('exhibitor-a@eventdex.invalid', 'Expositor A');
  v_visitor_a   := tests.create_user('visitor-a@eventdex.invalid',   'Visitante A');
  -- Un segundo visitante en la org A que ya reclamó y ya ganó. La sección de
  -- aislamiento corre ANTES que los reclamos, y sin él spot_claims y
  -- raffle_draws darían cero en las dos columnas: el gemelo positivo no
  -- probaría nada.
  v_visitor_a2  := tests.create_user('visitor-a2@eventdex.invalid',  'Visitante A2');
  v_owner_b     := tests.create_user('owner-b@eventdex.invalid',     'Owner B');
  v_visitor_b   := tests.create_user('visitor-b@eventdex.invalid',   'Visitante B');
  v_dev         := tests.create_user('dev@eventdex.invalid',         'Developer');

  -- El developer NO es miembro de ninguna organización: todo su acceso viene
  -- de platform_admins. Si fuera miembro, la sección 6 no probaría nada.
  insert into public.platform_admins (user_id, level, notes)
  values (v_dev, 'developer', 'Fixture de permissions.sql');

  -- Organización A ---------------------------------------------------------
  insert into public.organizations (slug, name) values ('test-org-a', 'Organización A')
  returning id into v_org_a;

  insert into public.organization_domains (organization_id, hostname, is_primary, verified_at)
  values (v_org_a, 'a.eventdex.invalid', true, now());

  insert into public.organization_members (organization_id, user_id, role, joined_at)
  values (v_org_a, v_owner_a, 'owner', now()),
         (v_org_a, v_staff_a, 'staff', now());

  insert into public.venues (organization_id, name, address_line, city)
  values (v_org_a, 'Sede A', 'Calle A 100', 'Buenos Aires')
  returning id into v_venue_a;

  insert into public.event_series (organization_id, slug, name)
  values (v_org_a, 'serie-a', 'Serie A') returning id into v_series_a;

  insert into public.spots (organization_id, slug, name, type)
  values (v_org_a, 'spot-a1', 'Spot A1', 'stand')      returning id into v_spot_a1;
  insert into public.spots (organization_id, slug, name, type)
  values (v_org_a, 'spot-a2', 'Spot A2', 'sponsor')    returning id into v_spot_a2;
  insert into public.spots (organization_id, slug, name, type)
  values (v_org_a, 'spot-a3', 'Spot A3', 'attraction') returning id into v_spot_a3;

  insert into public.events (organization_id, series_id, venue_id, slug, title,
                             edition_label, edition_number, created_by)
  values (v_org_a, v_series_a, v_venue_a, 'evento-a', 'Evento A', '2026', 1, v_owner_a)
  returning id into v_event_a;

  -- EN CURSO: es la única fase en la que claim_spot() acepta reclamos, y la
  -- sección 5 los necesita.
  insert into public.event_schedules (event_id, organization_id, label, starts_at, ends_at)
  values (v_event_a, v_org_a, 'Día 1', now() - interval '1 hour', now() + interval '7 hours');

  -- Tres spots del evento que cubren los tres estados que el anónimo tiene que
  -- distinguir: activo (lo ve), inactivo (no) y borrado (no).
  insert into public.event_spots (event_id, organization_id, spot_id, code, status)
  values (v_event_a, v_org_a, v_spot_a1, 'A01', 'active') returning id into v_es_a1;
  insert into public.event_spots (event_id, organization_id, spot_id, code, status)
  values (v_event_a, v_org_a, v_spot_a2, 'A02', 'inactive') returning id into v_es_a2;
  insert into public.event_spots (event_id, organization_id, spot_id, code, status, deleted_at)
  values (v_event_a, v_org_a, v_spot_a3, 'A03', 'active', now()) returning id into v_es_a3;

  insert into public.event_members (event_id, organization_id, user_id, role)
  values (v_event_a, v_org_a, v_exhibitor_a, 'exhibitor');

  insert into public.event_spot_exhibitors (event_spot_id, organization_id, user_id, can_edit)
  values (v_es_a1, v_org_a, v_exhibitor_a, true);

  -- Publicar de verdad y no con `status = 'published'` a mano: congela los
  -- snapshots y ejercita la función, igual que hace el seed.
  perform tests.authenticate_as(v_owner_a);
  perform public.publish_event(v_event_a);
  perform tests.as_superuser();

  insert into public.event_registrations (event_id, organization_id, user_id, source)
  values (v_event_a, v_org_a, v_visitor_a,  'landing'),
         (v_event_a, v_org_a, v_visitor_a2, 'qr');

  -- Directo y no vía claim_spot(): la sección 5 usa la función con el otro
  -- visitante, y si este reclamo ya existiera ahí, el primer llamado devolvería
  -- claimed = false y taparía el caso que interesa.
  insert into public.spot_claims (event_id, organization_id, event_spot_id, user_id)
  values (v_event_a, v_org_a, v_es_a1, v_visitor_a2);

  insert into public.raffles (event_id, organization_id, name, min_claims, created_by)
  values (v_event_a, v_org_a, 'Sorteo A', 1, v_owner_a) returning id into v_raffle_a;

  insert into public.raffle_draws (raffle_id, event_id, organization_id, user_id,
                                   prize_label, drawn_by)
  values (v_raffle_a, v_event_a, v_org_a, v_visitor_a2, 'Premio A', v_owner_a);

  insert into public.event_invoices (organization_id, event_id, concept, amount_cents)
  values (v_org_a, v_event_a, 'Licencia A', 100000);

  -- Organización B: todo privado -------------------------------------------
  -- El evento se queda en `draft` a propósito. Con un evento publicado, varias
  -- tablas serían visibles POR DISEÑO (eventos públicos, sus jornadas, sus
  -- spots activos, los ganadores del sorteo) y habría que ir tabla por tabla
  -- discutiendo cuál cero es el correcto. Con la B entera en borrador, la
  -- respuesta esperada es cero en todo.
  insert into public.organizations (slug, name) values ('test-org-b', 'Organización B')
  returning id into v_org_b;

  insert into public.organization_domains (organization_id, hostname, is_primary, verified_at)
  values (v_org_b, 'b.eventdex.invalid', true, now());

  insert into public.organization_members (organization_id, user_id, role, joined_at)
  values (v_org_b, v_owner_b, 'owner', now());

  insert into public.venues (organization_id, name, address_line, city)
  values (v_org_b, 'Sede B', 'Calle B 200', 'Córdoba') returning id into v_venue_b;

  insert into public.event_series (organization_id, slug, name)
  values (v_org_b, 'serie-b', 'Serie B') returning id into v_series_b;

  insert into public.spots (organization_id, slug, name, type)
  values (v_org_b, 'spot-b', 'Spot B', 'stand') returning id into v_spot_b;

  insert into public.events (organization_id, series_id, venue_id, slug, title, created_by)
  values (v_org_b, v_series_b, v_venue_b, 'evento-b', 'Evento B', v_owner_b)
  returning id into v_event_b;

  insert into public.event_schedules (event_id, organization_id, label, starts_at, ends_at)
  values (v_event_b, v_org_b, 'Día 1', now() - interval '1 hour', now() + interval '7 hours');

  insert into public.event_spots (event_id, organization_id, spot_id, code, status)
  values (v_event_b, v_org_b, v_spot_b, 'B01', 'active') returning id into v_es_b;

  insert into public.event_members (event_id, organization_id, user_id, role)
  values (v_event_b, v_org_b, v_owner_b, 'manager');

  insert into public.event_spot_exhibitors (event_spot_id, organization_id, user_id, can_edit)
  values (v_es_b, v_org_b, v_owner_b, true);

  insert into public.event_registrations (event_id, organization_id, user_id, source)
  values (v_event_b, v_org_b, v_visitor_b, 'landing');

  insert into public.spot_claims (event_id, organization_id, event_spot_id, user_id)
  values (v_event_b, v_org_b, v_es_b, v_visitor_b);

  insert into public.raffles (event_id, organization_id, name, min_claims, created_by)
  values (v_event_b, v_org_b, 'Sorteo B', 1, v_owner_b) returning id into v_raffle_b;

  insert into public.raffle_draws (raffle_id, event_id, organization_id, user_id,
                                   prize_label, drawn_by)
  values (v_raffle_b, v_event_b, v_org_b, v_visitor_b, 'Premio B', v_owner_b);

  insert into public.event_invoices (organization_id, event_id, concept, amount_cents)
  values (v_org_b, v_event_b, 'Licencia B', 200000);

  insert into public.audit_logs (organization_id, actor_id, actor_role, action,
                                 entity_type, entity_id)
  values (v_org_b, v_owner_b, 'owner', 'event.created', 'event', v_event_b);

  -- Ids a la tabla, para las secciones de abajo -----------------------------
  insert into tests.ids (key, id) values
    ('org_a', v_org_a), ('org_b', v_org_b),
    ('owner_a', v_owner_a), ('staff_a', v_staff_a), ('exhibitor_a', v_exhibitor_a),
    ('visitor_a', v_visitor_a), ('visitor_a2', v_visitor_a2),
    ('owner_b', v_owner_b), ('visitor_b', v_visitor_b), ('dev', v_dev),
    ('event_a', v_event_a), ('event_b', v_event_b),
    ('venue_a', v_venue_a),
    ('es_a1', v_es_a1), ('es_a2', v_es_a2), ('es_a3', v_es_a3), ('es_b', v_es_b),
    ('spot_a1', v_spot_a1);
end;
$fixture$;

-- La lista de relaciones con `organization_id`, calculada del catálogo y no a
-- mano. Es lo que hace que una tabla nueva quede cubierta el día que se crea,
-- que es justo el día en que uno se olvida de escribirle la política.
--
-- Incluye las VISTAS a propósito: son security_invoker, así que también tienen
-- que filtrar, y una vista que se olvide de esa opción es un agujero silencioso.
--
-- Se calcula ahora, como postgres. Si se calculara ya impersonando, la propia
-- information_schema filtraría por privilegios y la lista saldría incompleta.
create table tests.tenant_relations as
select c.table_name::text as relation
from information_schema.columns c
where c.table_schema = 'public'
  and c.column_name = 'organization_id'
  -- Excepción DOCUMENTADA, no olvido: organization_domains es un lookup de host
  -- abierto a propósito (no revela nada que el DNS no diga ya). Ver
  -- docs/04-rls.md. `organizations` no aparece porque su columna se llama `id`.
  and c.table_name <> 'organization_domains';

grant select on tests.tenant_relations to anon, authenticated;

-- ===========================================================================
-- 2 — Aislamiento entre organizaciones
--
-- Un staff de la org A no puede ver NADA de la org B. Es el único control de
-- este archivo cuyo incumplimiento no es un bug sino un incidente.
-- ===========================================================================

select tests.authenticate_as(tests.id('staff_a'));

do $iso$
declare r record;
begin
  for r in select relation from tests.tenant_relations order by 1 loop
    perform tests.check(
      '2. Aislamiento',
      format('%s — filas de la org ajena', r.relation),
      '0',
      tests.count_rows_of(r.relation, tests.id('org_b'))::text
    );

    perform tests.check(
      '2. Aislamiento (gemelo positivo)',
      format('%s — filas propias', r.relation),
      -- Las dos que un staff no ve ni siquiera de su propia organización:
      -- facturación es del owner y de plataforma, auditoría también.
      case when r.relation in ('event_invoices', 'audit_logs') then '0' else '>0' end,
      tests.count_rows_of(r.relation, tests.id('org_a'))::text
    );
  end loop;
end;
$iso$;

-- profiles no tiene organization_id, así que va aparte.
select tests.check_query('2. Aislamiento',
  'profiles — visitante que solo existe en la org ajena', '0',
  $sql$select count(*) from public.profiles where id = tests.id('visitor_b')$sql$);

-- El gemelo: esta política es la que permite listar participantes sin recurrir
-- a la service key, que es lo que hace la v1 en getEventParticipants.
select tests.check_query('2. Aislamiento (gemelo positivo)',
  'profiles — visitante de la organización propia', '1',
  $sql$select count(*) from public.profiles where id = tests.id('visitor_a')$sql$);

-- ===========================================================================
-- 3 — El visitante anónimo
-- ===========================================================================

select tests.as_anon();

select tests.check_query('3. Anónimo', 've el evento publicado', '1',
  $sql$select count(*) from public.events where id = tests.id('event_a')$sql$);

select tests.check_query('3. Anónimo', 'NO ve el evento en borrador', '0',
  $sql$select count(*) from public.events where id = tests.id('event_b')$sql$);

-- Que un QR de un spot inactivo o borrado no entregue medalla deja de ser una
-- regla de la aplicación (el .is("deleted_at", null) repetido de v1) y pasa a
-- ser invisibilidad a nivel base.
select tests.check_query('3. Anónimo', 've el spot activo', '1',
  $sql$select count(*) from public.event_spots where id = tests.id('es_a1')$sql$);

select tests.check_query('3. Anónimo', 'NO ve el spot inactivo', '0',
  $sql$select count(*) from public.event_spots where id = tests.id('es_a2')$sql$);

select tests.check_query('3. Anónimo', 'NO ve el spot borrado', '0',
  $sql$select count(*) from public.event_spots where id = tests.id('es_a3')$sql$);

-- La dirección de un evento publicado es información que el visitante necesita:
-- es a dónde tiene que ir. Es lo que arregló la migración 010.
select tests.check_query('3. Anónimo', 've la sede del evento publicado', '1',
  $sql$select count(*) from public.venues where organization_id = tests.id('org_a')$sql$);

select tests.check_query('3. Anónimo', 'NO ve la sede del evento en borrador', '0',
  $sql$select count(*) from public.venues where organization_id = tests.id('org_b')$sql$);

select tests.check_query('3. Anónimo', 'NO lee registros de nadie', '0',
  $sql$select count(*) from public.event_registrations$sql$);

select tests.check_query('3. Anónimo', 'NO lee reclamos de nadie', '0',
  $sql$select count(*) from public.spot_claims$sql$);

select tests.check_query('3. Anónimo', 'NO lee miembros de ninguna org', '0',
  $sql$select count(*) from public.organization_members$sql$);

-- ===========================================================================
-- 4 — Baja lógica: solo el owner
--
-- No hay política de DELETE en ninguna tabla ni grant de delete a
-- `authenticated`: dar de baja es UPDATE deleted_at, y quién puede hacerlo lo
-- decide el trigger app.guard_soft_delete(). Nunca se había ejecutado.
-- ===========================================================================

select tests.authenticate_as(tests.id('staff_a'));

select tests.denied('4. Baja lógica', 'staff: DELETE del evento',
  $sql$delete from public.events where id = tests.id('event_a')$sql$);

select tests.denied('4. Baja lógica', 'staff: baja lógica del evento',
  $sql$update public.events set deleted_at = now() where id = tests.id('event_a')$sql$);

select tests.denied('4. Baja lógica', 'staff: baja lógica de la sede',
  $sql$update public.venues set deleted_at = now() where id = tests.id('venue_a')$sql$);

-- ...pero editar el contenido del evento sí es su trabajo.
select tests.allowed('4. Baja lógica', 'staff: editar el título del evento',
  $sql$update public.events set title = 'Evento A editado' where id = tests.id('event_a')$sql$);

select tests.authenticate_as(tests.id('owner_a'));

select tests.allowed('4. Baja lógica', 'owner: baja lógica del evento',
  $sql$update public.events set deleted_at = now() where id = tests.id('event_a')$sql$);

-- Se revierte a mano: las secciones de abajo necesitan el evento vivo, y un
-- savepoint acá complicaría la lectura más de lo que ayuda.
select tests.as_superuser();
update public.events set deleted_at = null where id = tests.id('event_a');

-- ===========================================================================
-- 5 — El expositor
--
-- Su límite tiene dos mitades: QUÉ FILAS lo resuelve RLS, QUÉ COLUMNAS lo
-- resuelve el trigger app.guard_exhibitor_columns() — porque un GRANT de
-- columna en Supabase limitaría también al staff (ver docs/04-rls.md). Ese
-- trigger es lo único que separa a un expositor de editar el evento entero, y
-- hasta ahora nunca había corrido.
-- ===========================================================================

select tests.authenticate_as(tests.id('exhibitor_a'));

select tests.allowed('5. Expositor', 'edita el nombre de SU spot',
  $sql$update public.event_spots set name_override = 'Mi stand' where id = tests.id('es_a1')$sql$);

select tests.denied('5. Expositor', 'NO cambia los puntos de su spot',
  $sql$update public.event_spots set points = 99 where id = tests.id('es_a1')$sql$);

select tests.denied('5. Expositor', 'NO desactiva su spot',
  $sql$update public.event_spots set status = 'inactive' where id = tests.id('es_a1')$sql$);

select tests.denied('5. Expositor', 'NO da de baja su spot',
  $sql$update public.event_spots set deleted_at = now() where id = tests.id('es_a1')$sql$);

select tests.denied('5. Expositor', 'NO edita el spot de otro',
  $sql$update public.event_spots set name_override = 'Ajeno' where id = tests.id('es_a2')$sql$);

select tests.denied('5. Expositor', 'NO edita el evento',
  $sql$update public.events set title = 'Secuestrado' where id = tests.id('event_a')$sql$);

-- ===========================================================================
-- 6 — spot_claims: solo vía claim_spot()
--
-- La tabla no tiene políticas de INSERT/UPDATE/DELETE. Reclamar es una
-- transacción con reglas (¿evento en curso?, ¿spot activo?, ¿ya lo tenía?), así
-- que se expone como función security definer y no como INSERT libre.
-- ===========================================================================

select tests.authenticate_as(tests.id('visitor_a'));

select tests.denied('6. Reclamos', 'visitante: INSERT directo en spot_claims',
  $sql$insert into public.spot_claims (event_id, organization_id, event_spot_id, user_id)
       values (tests.id('event_a'), tests.id('org_a'), tests.id('es_a1'), tests.id('visitor_a'))$sql$);

select tests.check_query('6. Reclamos', 'el camino legítimo entrega la medalla', 'true',
  $sql$select claimed from public.claim_spot(tests.id('es_a1'))$sql$);

-- Idempotencia: en v1 esto dependía de que la app hiciera SELECT y después
-- INSERT, y de que el índice único cerrara la carrera.
select tests.check_query('6. Reclamos', 'reclamar dos veces no duplica', 'false',
  $sql$select claimed from public.claim_spot(tests.id('es_a1'))$sql$);

select tests.check_query('6. Reclamos', 'el visitante quedó con un solo reclamo', '1',
  $sql$select count(*) from public.spot_claims where user_id = tests.id('visitor_a')$sql$);

select tests.denied('6. Reclamos', 'NO se reclama un spot inactivo',
  $sql$select public.claim_spot(tests.id('es_a2'))$sql$);

select tests.denied('6. Reclamos', 'NO se reclama un spot borrado',
  $sql$select public.claim_spot(tests.id('es_a3'))$sql$);

-- Un reclamo es un hecho histórico: se inserta y no se toca más.
select tests.denied('6. Reclamos', 'el visitante NO edita su propio reclamo',
  $sql$update public.spot_claims set points_awarded = 999 where user_id = tests.id('visitor_a')$sql$);

-- "No se puede reclamar sin registro previo" no lo hace RLS sino la FK
-- compuesta contra event_registrations, así que se prueba con los privilegios
-- más altos que existen: ni siquiera postgres puede.
select tests.as_superuser();

select tests.denied('6. Reclamos', 'postgres: reclamo sin registro previo (FK)',
  $sql$insert into public.spot_claims (event_id, organization_id, event_spot_id, user_id)
       values (tests.id('event_a'), tests.id('org_a'), tests.id('es_a1'), tests.id('owner_b'))$sql$);

-- ===========================================================================
-- 7 — El developer
--
-- Lee todo, escribe solo facturación. No es miembro de ninguna organización:
-- todo su acceso viene de platform_admins.
-- ===========================================================================

select tests.authenticate_as(tests.id('dev'));

select tests.check_query('7. Developer', 've el evento en borrador de una org ajena', '1',
  $sql$select count(*) from public.events where id = tests.id('event_b')$sql$);

select tests.check_query('7. Developer', 've los miembros de las dos orgs', '3',
  $sql$select count(*) from public.organization_members$sql$);

select tests.check_query('7. Developer', 've la facturación de las dos orgs', '2',
  $sql$select count(*) from public.event_invoices$sql$);

-- can_edit_event() no incluye a los platform admins, y organizations solo la
-- toca el owner.
select tests.denied('7. Developer', 'NO edita un evento ajeno',
  $sql$update public.events set title = 'Tocado por el dev' where id = tests.id('event_b')$sql$);

select tests.denied('7. Developer', 'NO edita una organización',
  $sql$update public.organizations set name = 'Renombrada' where id = tests.id('org_b')$sql$);

select tests.denied('7. Developer', 'NO se agrega como miembro',
  $sql$insert into public.organization_members (organization_id, user_id, role)
       values (tests.id('org_b'), tests.id('dev'), 'owner')$sql$);

-- Darse acceso total a la plataforma no debe ser una acción de aplicación.
select tests.denied('7. Developer', 'NO se da de alta como platform admin',
  $sql$insert into public.platform_admins (user_id, level)
       values (tests.id('owner_b'), 'developer')$sql$);

select tests.allowed('7. Developer', 'marca una factura como pagada',
  $sql$update public.event_invoices set status = 'paid', paid_at = now()
       where organization_id = tests.id('org_b')$sql$);

-- Y el owner ve SU facturación pero no la del vecino.
select tests.authenticate_as(tests.id('owner_a'));

select tests.check_query('7. Developer', 'owner: ve su propia facturación', '1',
  $sql$select count(*) from public.event_invoices where organization_id = tests.id('org_a')$sql$);

select tests.check_query('7. Developer', 'owner: NO ve la facturación ajena', '0',
  $sql$select count(*) from public.event_invoices where organization_id = tests.id('org_b')$sql$);

select tests.authenticate_as(tests.id('staff_a'));

select tests.check_query('7. Developer', 'staff: no ve facturación en absoluto', '0',
  $sql$select count(*) from public.event_invoices$sql$);

-- ===========================================================================
-- El informe
--
-- Una sola sentencia, para que el SQL Editor la muestre entera. `fallas_totales`
-- se repite en cada fila a propósito: es lo primero que hay que mirar y así
-- está a mano sin tener que recorrer la tabla.
-- ===========================================================================

select tests.as_superuser();

select
  r.seccion,
  r.control,
  r.esperado,
  r.obtenido,
  r.veredicto,
  count(*) filter (where r.veredicto <> 'OK') over () as fallas_totales
from tests.results r
order by r.momento;

-- Nada de esto queda: ni el esquema tests, ni las organizaciones, ni los
-- usuarios. Si tuviste que comentar esta línea para ver el informe en el SQL
-- Editor, corré después el bloque de limpieza de abajo.
rollback;


-- ===========================================================================
-- Limpieza — SOLO si corriste el archivo con el `rollback` comentado
--
-- Mismo orden que supabase/snippets/reset-seed.sql y por el mismo motivo: un
-- `delete from organizations` pelado no alcanza, porque event_invoices y
-- event_spots.spot_id son `on delete restrict` y el orden en que Postgres
-- propaga las cascadas de una misma tabla no está garantizado.
--
-- Los usuarios van DESPUÉS de las organizaciones: borrar el auth.users de quien
-- es único owner de una organización viva falla por el guard del último owner.
-- ===========================================================================
--
-- do $limpieza$
-- declare v_org uuid;
-- begin
--   for v_org in select id from public.organizations where slug in ('test-org-a', 'test-org-b') loop
--     delete from public.spot_claims           where organization_id = v_org;
--     delete from public.raffle_draws          where organization_id = v_org;
--     delete from public.raffles               where organization_id = v_org;
--     delete from public.event_registrations   where organization_id = v_org;
--     delete from public.event_spot_exhibitors where organization_id = v_org;
--     delete from public.event_spots           where organization_id = v_org;
--     delete from public.event_members         where organization_id = v_org;
--     delete from public.event_schedules       where organization_id = v_org;
--     delete from public.events                where organization_id = v_org;
--     delete from public.spots                 where organization_id = v_org;
--     delete from public.venues                where organization_id = v_org;
--     delete from public.event_series          where organization_id = v_org;
--     delete from public.event_invoices        where organization_id = v_org;
--     delete from public.audit_logs            where organization_id = v_org;
--     delete from public.organizations         where id = v_org;
--   end loop;
--
--   delete from auth.users where email like '%@eventdex.invalid';
--   raise notice 'Fixture de permisos borrado.';
-- end;
-- $limpieza$;
--
-- drop schema if exists tests cascade;
