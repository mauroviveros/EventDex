-- Verificación post-reset. Las queries de docs/sql/README.md, en un solo archivo.
--
--   pnpm exec supabase db reset && psql "$(pnpm exec supabase status -o env | ...)" -f supabase/tests/verify.sql
--
-- Las tres primeras tienen que devolver 0 filas. La cuarta, la edición próxima.

\echo '== 1. Tablas de public sin RLS (debe estar vacío) =='
select tablename
from pg_tables
where schemaname = 'public' and not rowsecurity;

\echo '== 2. Tablas con RLS pero sin políticas (debe estar vacío) =='
select t.tablename
from pg_tables t
left join pg_policies p on p.tablename = t.tablename and p.schemaname = 'public'
where t.schemaname = 'public'
group by t.tablename
having count(p.policyname) = 0;

\echo '== 3. Vistas de public sin security_invoker (debe estar vacío) =='
select c.relname
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'v'
  and coalesce(
        (select option_value
         from pg_options_to_table(c.reloptions)
         where option_name = 'security_invoker'),
        'false'
      ) <> 'true';

\echo '== 4. Evento activo (debe ser la edición 2026, fase upcoming) =='
select e.title, e.edition_label, t.phase
from public.events e
join public.event_timeline t on t.event_id = e.id
where e.id = public.resolve_active_event(
  public.resolve_organization('localhost:4321')
);

\echo '== 5. Spots del catálogo reutilizados (5 spots x 2 ediciones) =='
select s.name, count(es.id) as ediciones
from public.spots s
left join public.event_spots es on es.spot_id = s.id
group by s.name
order by s.name;
