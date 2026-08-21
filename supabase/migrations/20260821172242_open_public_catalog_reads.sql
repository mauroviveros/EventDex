-- 010 — Lecturas públicas del catálogo
--
-- Corrige un hueco del diseño original: `venues` y `spots` quedaron con
-- políticas `to authenticated`, así que un visitante anónimo recibía CERO filas
-- de las dos. Sin error: simplemente vacío.
--
-- Eso rompía dos cosas de la app pública:
--   1. La sede del evento no se mostraba (`event.venue` llegaba null).
--   2. La grilla de stands salía sin nombres, porque la cadena de resolución
--      del ADR-0003 cae a `spots.name` cuando no hay override ni snapshot.
--
-- El criterio es exponer lo que el visitante YA VE en pantalla, y nada más.
-- El catálogo no se abre entero: un spot archivado, o que todavía no está en
-- ningún evento, sigue siendo invisible.
--

-- ---------------------------------------------------------------------------
-- venues
--
-- La dirección de un evento publicado es información pública: es a dónde tiene
-- que ir la gente. Se expone la fila entera (incluye lat/lng para un mapa),
-- pero solo de sedes usadas por un evento publicado y público.
-- ---------------------------------------------------------------------------

create policy venues_select_public on public.venues
  for select to anon, authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.events e
      where e.venue_id = venues.id
        and e.status = 'published'
        and e.visibility = 'public'
        and e.deleted_at is null
    )
  );

-- La política filtra por `events.venue_id` y Postgres NO crea índices para las
-- claves foráneas automáticamente: sin esto, cada lectura de una sede hace un
-- seq scan sobre `events`.
create index if not exists events_venue_idx
  on public.events (venue_id)
  where venue_id is not null;

-- ---------------------------------------------------------------------------
-- spots
--
-- Solo los que están activos en algún evento publicado, que son exactamente los
-- que aparecen en la grilla. Se apoya en `event_spots_spot_idx`, que ya existe.
-- ---------------------------------------------------------------------------

create policy spots_select_public on public.spots
  for select to anon, authenticated
  using (
    archived_at is null
    and exists (
      select 1
      from public.event_spots es
      join public.events e on e.id = es.event_id
      where es.spot_id = spots.id
        and es.deleted_at is null
        and es.status = 'active'
        and e.status = 'published'
        and e.visibility = 'public'
        and e.deleted_at is null
    )
  );

-- `event_series` queda cerrado a propósito: la app muestra `events.title`, no
-- el nombre de la serie. Cuando haga falta ("parte de Expo Ubbe"), se le abre
-- una política con el mismo criterio.
