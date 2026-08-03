-- Baja lógica de stands, con el mismo criterio que `events.deleted_at`: un
-- stand borrado deja de listarse y de entregar medallas, pero la fila queda en
-- la base porque `user_spot_history` la referencia. Un borrado real arrastraría
-- el historial de los visitantes que ya lo escanearon.

alter table public.event_spots
  add column if not exists deleted_at timestamptz;

-- Todas las lecturas del dashboard y de la app pública son "los stands vivos
-- de un evento": el índice parcial es el que sirve exactamente esa consulta.
create index if not exists event_spots_event_id_active_idx
  on public.event_spots (event_id)
  where deleted_at is null;
