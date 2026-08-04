-- 009 — Seed de desarrollo
--
-- Una organización, una serie, dos ediciones (una terminada y una próxima),
-- una sede y cinco spots del catálogo reutilizados entre ambas.
--
-- Sirve para verificar de una que resolve_active_event() elige bien y que un
-- mismo spot vive en dos ediciones sin duplicarse.
--
-- ⚠️ Requiere usuarios existentes en auth.users. Creá dos desde el dashboard de
-- Supabase (uno owner, uno visitante) y reemplazá los UUID de abajo.

do $$
declare
  v_owner_id   uuid := '00000000-0000-0000-0000-000000000001';  -- ← reemplazar
  v_visitor_id uuid := '00000000-0000-0000-0000-000000000002';  -- ← reemplazar

  v_org      uuid;
  v_venue    uuid;
  v_series   uuid;
  v_past     uuid;
  v_next     uuid;
  v_spot     uuid;
  v_names    text[] := array['Café Ubbe', 'Laberinto', 'Sponsor X', 'Escenario', 'Food Truck'];
  v_types    public.spot_type[] := array['stand', 'attraction', 'sponsor', 'activity', 'stand']::public.spot_type[];
  i int;
begin
  -- Organización -----------------------------------------------------------
  insert into public.organizations (slug, name, legal_name, brand)
  values ('ubbe', 'TRY Ubbe', 'TRY Ubbe SRL',
          '{"primary":"#7c3aed","radius":"0.75rem"}'::jsonb)
  returning id into v_org;

  insert into public.organization_domains (organization_id, hostname, is_primary, verified_at)
  values (v_org, 'localhost:4321', true, now()),
         (v_org, 'expoubbe.com',   false, null);

  insert into public.organization_members (organization_id, user_id, role, joined_at)
  values (v_org, v_owner_id, 'owner', now());

  insert into public.platform_admins (user_id, level, notes)
  values (v_owner_id, 'developer', 'Seed de desarrollo')
  on conflict do nothing;

  -- Sede reutilizable ------------------------------------------------------
  insert into public.venues (organization_id, name, address_line, city, state, country, timezone)
  values (v_org, 'Predio Ferial', 'Av. Siempreviva 742', 'Buenos Aires', 'CABA', 'AR',
          'America/Argentina/Buenos_Aires')
  returning id into v_venue;

  -- Serie ------------------------------------------------------------------
  insert into public.event_series (organization_id, slug, name, description)
  values (v_org, 'expo-ubbe', 'Expo Ubbe', 'La expo anual de TRY Ubbe')
  returning id into v_series;

  -- Catálogo de spots: existen SIN evento ----------------------------------
  for i in 1..array_length(v_names, 1) loop
    insert into public.spots (organization_id, slug, name, description, type)
    values (v_org,
            lower(regexp_replace(v_names[i], '[^a-zA-Z0-9]+', '-', 'g')),
            v_names[i],
            'Descripción de ' || v_names[i],
            v_types[i]);
  end loop;

  -- Edición pasada ---------------------------------------------------------
  insert into public.events (organization_id, series_id, venue_id, slug, title,
                             edition_label, edition_number, summary, description,
                             timezone, status, published_at, created_by)
  values (v_org, v_series, v_venue, 'expo-ubbe-2025', 'Expo Ubbe',
          '2025', 1, 'La primera edición', 'Descripción larga',
          'America/Argentina/Buenos_Aires', 'published', now() - interval '1 year', v_owner_id)
  returning id into v_past;

  insert into public.event_schedules (event_id, organization_id, label, starts_at, ends_at)
  values (v_past, v_org, 'Día 1', now() - interval '365 days', now() - interval '364 days');

  -- Edición próxima --------------------------------------------------------
  insert into public.events (organization_id, series_id, venue_id, slug, title,
                             edition_label, edition_number, summary, description,
                             timezone, status, published_at, created_by)
  values (v_org, v_series, v_venue, 'expo-ubbe-2026', 'Expo Ubbe',
          '2026', 2, 'La segunda edición', 'Descripción larga',
          'America/Argentina/Buenos_Aires', 'published', now(), v_owner_id)
  returning id into v_next;

  insert into public.event_schedules (event_id, organization_id, label, starts_at, ends_at)
  values (v_next, v_org, 'Día 1', now() + interval '30 days', now() + interval '30 days 8 hours'),
         (v_next, v_org, 'Día 2', now() + interval '31 days', now() + interval '31 days 8 hours');

  -- Los MISMOS spots del catálogo en las dos ediciones. Esto es lo que la v1
  -- no permitía: ahí habría que haberlos cargado dos veces.
  i := 0;
  for v_spot in select id from public.spots where organization_id = v_org order by created_at loop
    i := i + 1;
    insert into public.event_spots (event_id, organization_id, spot_id, code, booth, sort_order)
    values (v_past, v_org, v_spot, 'A' || lpad(i::text, 2, '0'), 'Pabellón A · ' || i, i);

    insert into public.event_spots (event_id, organization_id, spot_id, code, booth, sort_order)
    values (v_next, v_org, v_spot, 'B' || lpad(i::text, 2, '0'), 'Pabellón B · ' || i, i);
  end loop;

  -- Sorteo de la edición próxima -------------------------------------------
  insert into public.raffles (event_id, organization_id, name, status, min_claims, created_by)
  values (v_next, v_org, 'Sorteo principal', 'draft', 3, v_owner_id);

  -- Facturación -------------------------------------------------------------
  insert into public.event_invoices (organization_id, event_id, concept, amount_cents, status, due_at)
  values (v_org, v_next, 'Licencia Expo Ubbe 2026', 45000000, 'pending', current_date + 30);

  raise notice 'Seed OK — org % / edición próxima %', v_org, v_next;
end $$;

-- Verificación rápida --------------------------------------------------------
-- Debe devolver la edición 2026 (la próxima), no la 2025 (terminada):
--
--   select e.title, e.edition_label, t.phase
--   from public.events e
--   join public.event_timeline t on t.event_id = e.id
--   where e.id = public.resolve_active_event(
--     public.resolve_organization('localhost:4321')
--   );
--
-- Y este debe mostrar 5 spots del catálogo usados en 2 eventos cada uno:
--
--   select s.name, count(es.id) as ediciones
--   from public.spots s
--   left join public.event_spots es on es.spot_id = s.id
--   group by s.name order by s.name;
