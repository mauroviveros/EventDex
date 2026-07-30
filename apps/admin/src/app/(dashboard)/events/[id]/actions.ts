"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/libs/supabase/service";
import { requireMembership } from "@/server/guard";
import type { Enums } from "@/types";

/**
 * Activa o desactiva un stand.
 *
 * El `spotId` llega del cliente y el service client no pasa por RLS, así que
 * la comprobación de que el spot cuelga de un evento de la organización del
 * usuario es la única barrera de autorización: sin ella, cualquier sesión
 * válida podría togglear stands ajenos.
 */
export async function setSpotStatus(
  eventId: string,
  spotId: string,
  status: Enums<"SPOT_STATUS">,
) {
  const { membership } = await requireMembership();
  const service = createServiceClient();

  const { data: spot } = await service
    .from("event_spots")
    .select("id, event:event_id!inner(organization_id)")
    .eq("id", spotId)
    .eq("event_id", eventId)
    .eq("event.organization_id", membership.organization.id)
    .maybeSingle();

  if (!spot) return;

  await service
    .from("event_spots")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", spotId);

  revalidatePath(`/events/${eventId}`);
}
