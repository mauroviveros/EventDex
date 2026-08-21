-- Borra la organización de prueba para volver a correr `supabase/seed.sql`.
--
-- ⚠️ SOLO DESARROLLO. Borra datos de verdad, sin baja lógica.
--
-- Un `delete from organizations` pelado NO alcanza, por dos motivos:
--
--   1. `event_invoices.organization_id` es `on delete restrict` — a propósito:
--      los registros de facturación no se evaporan porque alguien borre una
--      organización. Hay que sacarlos explícitamente.
--
--   2. `event_spots.spot_id` también es `restrict`, y el orden en que Postgres
--      propaga las cascadas de una misma tabla no está garantizado. Si intenta
--      borrar `spots` antes que `event_spots`, falla. Por eso se borra en orden
--      explícito de hijos a padres en vez de confiar en la cascada.
--
-- `organization_members` y `organization_domains` NO se borran acá: salen por
-- cascada al borrar la organización. Borrarlos antes chocaría con el guard del
-- último owner, que solo se desactiva cuando la organización ya no existe
-- (ver migración `fix_owner_guard_on_cascade`).

do $$
declare
  v_org uuid;
begin
  select id into v_org from public.organizations where slug = 'ubbe';

  if v_org is null then
    raise notice 'No hay organización "ubbe" que borrar.';
    return;
  end if;

  -- Participación (hijos más profundos primero)
  delete from public.spot_claims           where organization_id = v_org;
  delete from public.raffle_draws          where organization_id = v_org;
  delete from public.raffles               where organization_id = v_org;
  delete from public.event_registrations   where organization_id = v_org;

  -- Eventos y su relación con el catálogo
  delete from public.event_spot_exhibitors where organization_id = v_org;
  delete from public.event_spots           where organization_id = v_org;
  delete from public.event_members         where organization_id = v_org;
  delete from public.event_schedules       where organization_id = v_org;
  delete from public.events                where organization_id = v_org;

  -- Catálogo (después de event_spots, por el `restrict` sobre spot_id)
  delete from public.spots                 where organization_id = v_org;
  delete from public.venues                where organization_id = v_org;
  delete from public.event_series          where organization_id = v_org;

  -- Facturación y auditoría
  delete from public.event_invoices        where organization_id = v_org;
  delete from public.audit_logs            where organization_id = v_org;

  -- Miembros y dominios se van por cascada.
  delete from public.organizations         where id = v_org;

  raise notice 'Organización % borrada. Ya podés correr seed.sql.', v_org;
end $$;
