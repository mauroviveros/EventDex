import { createServiceClient } from "@/libs/supabase/service";
import type { EventScan } from "@/types";

/**
 * Escaneos crudos de un conjunto de stands, del más reciente al más viejo.
 *
 * Se lee una sola vez por request y de acá derivan tanto el resumen como las
 * estadísticas (ambas funciones son puras y reciben estas filas).
 */
export async function getEventScans(spotIds: string[]): Promise<EventScan[]> {
  if (spotIds.length === 0) return [];

  const { data, error } = await createServiceClient()
    .from("user_spot_history")
    .select("id, spot_id, user_id, collected_at")
    .in("spot_id", spotIds)
    .order("collected_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
