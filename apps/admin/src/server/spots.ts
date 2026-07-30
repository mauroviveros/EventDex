import { createServiceClient } from "@/libs/supabase/service";
import type { EventSpot } from "@/types";
import { countBy } from "@/utils";

/**
 * Stands de un evento con su avatar público y su cantidad de escaneos,
 * ordenados de más a menos escaneado.
 *
 * El caller ya validó que el evento pertenece a la organización con
 * `getOrganizationEvent` (la página hace `notFound()` si no); acá el service
 * client solo filtra por `event_id`.
 */
export async function getEventSpots(eventId: string): Promise<EventSpot[]> {
  const service = createServiceClient();

  const { data: spots, error } = await service
    .from("event_spots")
    .select("id, name, type, status, avatar_path")
    .eq("event_id", eventId);

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
      // El bucket `spot` es público: la URL se arma sin firmar y no expira.
      avatarUrl: service.storage.from("spot").getPublicUrl(spot.avatar_path)
        .data.publicUrl,
      count: { scans: scansPerSpot.get(spot.id) ?? 0 },
    }))
    .sort((a, b) => b.count.scans - a.count.scans);
}
