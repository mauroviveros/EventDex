-- Resolución del sitio en UNA sola llamada.
--
-- El middleware de `apps/web` hacía dos viajes por request:
--   resolve_organization(hostname) → uuid
--   resolve_active_event(uuid)     → uuid
--
-- Y el primero tiraba el resto de la fila: la organización ya se tocaba, pero
-- el nombre y la marca quedaban afuera, así que el `<title>` y el `og:site_name`
-- no tenían de dónde salir.
--
-- Esto devuelve todo junto. Con el proyecto hosteado en otra región, ahorrar un
-- round trip en el camino MÁS caliente de la app son 100-300 ms de TTFB en cada
-- página, incluso para un visitante anónimo que solo mira la home.
--
-- Compone `resolve_active_event` en vez de repetir su lógica, y se apoya en la
-- vista `public_organizations` para el filtro de "activa y no borrada".
--
-- `resolve_organization` queda: no la usa más la app, pero la usan las queries
-- de verificación (supabase/tests/verify.sql) y sirve para depurar a mano.

create or replace function public.resolve_site(p_hostname text)
returns table (
  organization_id   uuid,
  organization_name text,
  organization_slug extensions.citext,
  brand             jsonb,
  event_id          uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    o.id,
    o.name,
    o.slug,
    o.brand,
    public.resolve_active_event(o.id)
  from public.organization_domains d
  join public.public_organizations o on o.id = d.organization_id
  where d.hostname = p_hostname::extensions.citext
  limit 1;
$$;

-- La app pública la llama sin sesión, así que `anon` también necesita el grant.
grant execute on function public.resolve_site(text) to anon, authenticated;
