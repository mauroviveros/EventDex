import type { Client } from "@eventdex/supabase/astro";

/**
 * Resultado de intentar reclamar. Es una unión discriminada para que la página
 * tenga que contemplar todos los casos: si agregás uno, el `switch` del render
 * deja de compilar hasta que lo manejes.
 */
export type ClaimOutcome =
  | { status: "claimed"; totalClaims: number }
  | { status: "already"; totalClaims: number }
  | { status: "unauthenticated" }
  | { status: "unavailable" }
  | { status: "not-live" }
  | { status: "error" };

/**
 * Reclama la medalla.
 *
 * Toda la validación está en `claim_spot()`: evento en curso, spot activo,
 * registro creado si falta, insert idempotente. Acá NO se re-chequea nada de
 * eso — hacerlo sería tener dos fuentes de verdad que se desincronizan.
 *
 * La función lanza excepciones con SQLSTATE y PostgREST las devuelve en
 * `error.code`. Ese switch es toda la lógica de errores de la app.
 */
export async function claimSpot(supabase: Client, eventSpotId: string): Promise<ClaimOutcome> {
  const { data, error } = await supabase
    .rpc("claim_spot", { p_event_spot_id: eventSpotId })
    .single();

  if (error) {
    switch (error.code) {
      case "42501":
        return { status: "unauthenticated" };
      case "P0002":
        return { status: "unavailable" };
      case "P0003":
        return { status: "not-live" };
      default:
        return { status: "error" };
    }
  }

  // `claimed` es false cuando el `on conflict do nothing` no insertó: ya la tenía.
  return {
    status: data.claimed ? "claimed" : "already",
    totalClaims: data.total_claims,
  };
}
/** Si este visitante ya tiene la medalla de este spot. */
export async function hasClaimed(
  supabase: Client,
  eventSpotId: string,
  userId: string
): Promise<boolean> {
  const { count } = await supabase
    .from("spot_claims")
    .select("id", { count: "exact", head: true })
    .eq("event_spot_id", eventSpotId)
    .eq("user_id", userId);

  return (count ?? 0) > 0;
}

/**
 * Ids de los spots que este visitante ya reclamó en un evento.
 *
 * Devuelve ids y no un conteo porque `collectionProgress` los intersecta con
 * los spots activos: con dos números sueltos no se puede saber que uno de los
 * reclamos era de un stand que el organizador desactivó a mitad del evento.
 */
export async function getClaimedSpotIds(
  supabase: Client,
  eventId: string,
  userId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("spot_claims")
    .select("event_spot_id")
    .eq("user_id", userId)
    .eq("event_id", eventId);

  return (data ?? []).map(({ event_spot_id }) => event_spot_id);
}
