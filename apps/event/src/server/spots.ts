import { createClient } from "@/libs/supabase/server";
import { getActiveEventId } from "./events";

/**
 * Todos los spots vivos del evento activo, con la URL pública de su avatar
 * resuelta. Un spot dado de baja desde el dashboard (`deleted_at`) desaparece
 * de la colección: su fila sigue existiendo solo para no romper el historial
 * de quienes ya lo escanearon.
 */
export async function getEventSpots() {
  const eventId = await getActiveEventId();
  if (!eventId) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("event_spots")
    .select("*, event:event_id(*)")
    .eq("event_id", eventId)
    .is("deleted_at", null);

  return (data ?? []).map((spot) => ({
    ...spot,
    avatar_url: supabase.storage.from("spot").getPublicUrl(spot.avatar_path)
      .data.publicUrl,
  }));
}

/**
 * Spot puntual del evento activo (null si no existe, está dado de baja o es de
 * otro evento). Un QR impreso de un spot borrado —o de una edición anterior—
 * deja de entregar medalla y cae en el mismo 404 que un id inventado.
 */
export async function getEventSpot(id: string) {
  const eventId = await getActiveEventId();
  if (!eventId) return null;

  const supabase = await createClient();
  const { data: spot } = await supabase
    .from("event_spots")
    .select("*, event:event_id(*)")
    .eq("id", id)
    .eq("event.id", eventId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!spot) return null;

  const avatar_url = supabase.storage
    .from("spot")
    .getPublicUrl(spot.avatar_path).data.publicUrl;
  return { ...spot, avatar_url };
}

/** Historial de medallas coleccionadas por un usuario. */
export async function getUserMedalHistory(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_spot_history")
    .select("*, spot:event_spots(*, event:event_id(id))")
    .eq("user_id", userId);
  return data ?? [];
}

/** Código Postgres de violación de unicidad (unique_violation). */
const UNIQUE_VIOLATION = "23505";

/**
 * Registra que un usuario coleccionó un spot. Es idempotente: si ya lo tenía, no
 * inserta de nuevo.
 * - `alreadyCollected`: ya lo tenía antes de esta llamada.
 * - `justCollected`: se insertó en esta llamada (dispara la celebración).
 *
 * La lectura previa cubre el caso común (re-escaneo del mismo QR). Para la carrera
 * (dos escaneos casi simultáneos que pasan ambos la lectura), nos apoyamos en el
 * índice único (user_id, spot_id): el segundo insert falla con 23505 y lo tratamos
 * como ya coleccionado, evitando filas duplicadas que inflarían el conteo del sorteo.
 */
export async function collectMedal(userId: string, spotId: string) {
  const supabase = await createClient();
  const { data: existing, error } = await supabase
    .from("user_spot_history")
    .select("id")
    .eq("user_id", userId)
    .eq("spot_id", spotId)
    .maybeSingle();

  const alreadyCollected = Boolean(existing);
  // Si ya la tenía, o la lectura falló, no intentamos insertar.
  if (alreadyCollected || error) {
    return { alreadyCollected, justCollected: false };
  }

  const { error: insertError } = await supabase
    .from("user_spot_history")
    .insert({
      user_id: userId,
      spot_id: spotId,
      collected_at: new Date().toISOString(),
    });

  if (insertError) {
    // Carrera: otro request concurrente ya la insertó → ya coleccionada.
    return {
      alreadyCollected: insertError.code === UNIQUE_VIOLATION,
      justCollected: false,
    };
  }

  return { alreadyCollected: false, justCollected: true };
}
