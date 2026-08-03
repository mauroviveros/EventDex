import { createServiceClient } from "@/libs/supabase/service";
import type { EventSpot, EventSpotDetail } from "@/types";
import { countBy } from "@/utils";

/** El bucket `spot` es público: la URL se arma sin firmar y no expira. */
function avatarUrl(
  service: ReturnType<typeof createServiceClient>,
  path: string,
) {
  return service.storage.from("spot").getPublicUrl(path).data.publicUrl;
}

/**
 * Stands de un evento con su avatar público y su cantidad de escaneos,
 * ordenados de más a menos escaneado.
 *
 * El caller ya validó que el evento pertenece a la organización con
 * `getOrganizationEvent` (la página hace `notFound()` si no); acá el service
 * client solo filtra por `event_id`.
 *
 * Los stands dados de baja quedan fuera: su fila sigue en la base para no
 * romper el historial de escaneos, pero el dashboard no los muestra.
 */
export async function getEventSpots(eventId: string): Promise<EventSpot[]> {
  const service = createServiceClient();

  const { data: spots, error } = await service
    .from("event_spots")
    .select("id, name, type, status, avatar_path")
    .eq("event_id", eventId)
    .is("deleted_at", null);

  // Se propaga en vez de devolver [] para no confundir "falla la query" con
  // "el evento no tiene stands" (p. ej. si falta aplicar la migración).
  if (error) throw error;
  if (!spots || spots.length === 0) return [];

  // Los escaneos se agregan en JS, igual que en getOrganizationEvents: a la
  // escala actual (miles de filas) es más simple que una RPC y alcanza.
  const { data: scans } = await service
    .from("user_spot_history")
    .select("spot_id")
    .in(
      "spot_id",
      spots.map((spot) => spot.id),
    );

  const scansPerSpot = countBy(scans ?? [], (scan) => scan.spot_id);

  return spots
    .map((spot) => ({
      ...spot,
      avatarUrl: avatarUrl(service, spot.avatar_path),
      count: { scans: scansPerSpot.get(spot.id) ?? 0 },
    }))
    .sort((a, b) => b.count.scans - a.count.scans);
}

/**
 * Stand puntual para el formulario de edición. Null si no existe, está dado de
 * baja o no cuelga de ese evento — el filtro por `event_id` es la barrera de
 * autorización (el caller ya validó que el evento es de su organización).
 */
export async function getEventSpot(
  eventId: string,
  spotId: string,
): Promise<EventSpotDetail | null> {
  const service = createServiceClient();

  const { data: spot } = await service
    .from("event_spots")
    .select("id, name, description, location, type, status, avatar_path")
    .eq("id", spotId)
    .eq("event_id", eventId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!spot) return null;

  return { ...spot, avatarUrl: avatarUrl(service, spot.avatar_path) };
}
