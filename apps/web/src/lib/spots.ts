import { resolveSpot, type SpotPresentation } from "@eventdex/domain";
import type { Client } from "@eventdex/supabase/astro";

/** Un spot listo para renderizar: la relación con la presentación ya resuelta. */
export interface EventSpotCard extends SpotPresentation {
  id: string;
  code: string;
  booth: string | null;
}

/**
 * Spots visibles del evento, con la cadena de resolución ya aplicada.
 *
 * No se consulta la vista `event_spots_resolved`: la vista devuelve todas sus
 * columnas como nullables —Postgres no puede inferir NOT NULL a través de una
 * vista— y el admin va a necesitar los datos SIN resolver para poder mostrar
 * "esto viene del catálogo" vs "esto es un override de esta edición". Leer las
 * tablas y resolver en JS deja una sola forma del dato para las dos apps.
 *
 * `spots!inner` fuerza un inner join: si por RLS el spot del catálogo no fuera
 * visible, la fila entera se descarta en vez de llegar a medias. Es lo que
 * mantiene `spot` no-nullable del lado de los tipos.
 *
 * No hay `.eq("status", "active")` ni `.is("deleted_at", null)`: eso lo hace
 * RLS. Un spot inactivo o dado de baja directamente no existe para el
 * visitante anónimo.
 */
export async function getEventSpots(supabase: Client, eventId: string): Promise<EventSpotCard[]> {
  const { data, error } = await supabase
    .from("event_spots")
    .select(`
      id, code, booth,
      name_override, description_override, avatar_path_override, snapshot,
      spot:spots!inner (name, description, avatar_path, type)
    `)
    .eq("event_id", eventId)
    .order("sort_order");

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    code: row.code,
    booth: row.booth,
    ...resolveSpot(row, row.spot)
  }));
}
