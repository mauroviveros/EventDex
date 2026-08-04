-- 006 — Facturación y auditoría
--
-- Las dos tablas que existen por el rol developer.

-- ---------------------------------------------------------------------------
-- event_invoices
--
-- Registro contable manual: sin integración de pagos. Si más adelante entra
-- Mercado Pago o Stripe, la tabla ya tiene la forma para colgarle un
-- payment_provider_id.
-- ---------------------------------------------------------------------------

create table public.event_invoices (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  event_id        uuid references public.events (id) on delete set null,  -- null = cargo a nivel org
  concept         text not null,
  -- Dinero en enteros (centavos). NUNCA float.
  amount_cents    bigint not null,
  currency        char(3) not null default 'ARS',
  status          public.invoice_status not null default 'pending',
  issued_at       date not null default current_date,
  due_at          date,
  paid_at         timestamptz,
  -- El platform admin que la marcó como pagada.
  marked_by       uuid references public.profiles (id),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,

  constraint event_invoices_amount_positive check (amount_cents >= 0),
  constraint event_invoices_paid_consistency check (
    (status = 'paid') = (paid_at is not null)
  )
);

create index event_invoices_org_idx    on public.event_invoices (organization_id, status);
create index event_invoices_status_idx on public.event_invoices (status, due_at);

create trigger event_invoices_set_updated_at
  before update on public.event_invoices
  for each row execute function app.set_updated_at();

-- ---------------------------------------------------------------------------
-- audit_logs
--
-- Existe principalmente por el rol developer: si alguien tiene acceso
-- cross-organización, todo lo que toca queda registrado.
-- ---------------------------------------------------------------------------

create table public.audit_logs (
  -- bigserial: append-only y de alto volumen, no se expone por id.
  id              bigserial primary key,
  organization_id uuid references public.organizations (id) on delete set null,
  actor_id        uuid references public.profiles (id)      on delete set null,
  -- Congelado: el rol del actor puede cambiar después del hecho.
  actor_role      text,
  action          text not null,                 -- 'event.published', 'invoice.paid'
  entity_type     text not null,
  entity_id       uuid,
  diff            jsonb,
  created_at      timestamptz not null default now()
);

create index audit_logs_org_time_idx on public.audit_logs (organization_id, created_at desc);
create index audit_logs_entity_idx   on public.audit_logs (entity_type, entity_id);

-- Helper para que las funciones security definer registren sin repetir el insert.
create or replace function app.audit(
  p_organization_id uuid,
  p_action          text,
  p_entity_type     text,
  p_entity_id       uuid,
  p_diff            jsonb default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, diff)
  values (p_organization_id, (select auth.uid()), p_action, p_entity_type, p_entity_id, p_diff);
$$;
