-- Permite deshabilitar un stand sin borrarlo: un spot INACTIVE se muestra
-- apagado en el dashboard y (más adelante) deja de entregar medallas en la app
-- pública. Enum propio en vez de reusar `event_status` para poder evolucionar
-- los estados de spot sin tocar los de evento.

create type "SPOT_STATUS" as enum ('ACTIVE', 'INACTIVE');

-- not null + default: los spots existentes quedan activos y la UI no maneja nulls.
alter table public.event_spots
  add column if not exists status "SPOT_STATUS" not null default 'ACTIVE';
