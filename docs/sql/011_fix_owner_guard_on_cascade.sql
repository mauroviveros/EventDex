-- 011 — El guard del último owner bloqueaba el borrado en cascada
--
-- `app.prevent_last_owner_removal()` corre en el DELETE de
-- `organization_members`. Al borrar una organización, el `on delete cascade`
-- propaga el borrado a sus miembros y el trigger lo rechazaba:
--
--   ERROR: La organización debe conservar al menos un owner activo
--   CONTEXT: SQL statement "DELETE FROM ONLY organization_members ..."
--
-- El trigger no distinguía dos situaciones distintas:
--   · alguien saca un miembro de una organización que sigue existiendo → hay
--     que proteger al último owner;
--   · la organización entera se está borrando → borrar sus miembros es
--     justamente lo correcto.
--
-- Postgres borra la fila PADRE antes de propagar a los hijos, así que dentro
-- del trigger se puede preguntar si la organización todavía existe: si no está,
-- el borrado viene de arriba.
--
-- ⚠️ Esta carpeta es referencia del diseño. La fuente de verdad es el archivo
-- equivalente en `supabase/migrations/`, creado con
-- `pnpm db:new fix_owner_guard_on_cascade`.

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
  -- Borrado en cascada desde `organizations`: la fila padre ya no está.
  -- No hay owner que proteger porque no queda organización.
  if not exists (select 1 from public.organizations where id = v_org) then
    return coalesce(new, old);
  end if;

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

-- Nota sobre un caso que NO cambia: borrar el `auth.users` de alguien que es
-- único owner de una organización viva sigue fallando, porque ahí el trigger
-- hace bien su trabajo — la organización quedaría huérfana. Para eso hay que
-- transferir la propiedad primero.
