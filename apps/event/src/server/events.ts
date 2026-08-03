import { cache } from "react";
import { serverEnv } from "@/config/env.server";
import { createPublicClient } from "@/libs/supabase/public";
import { createClient } from "@/libs/supabase/server";
import type { Event } from "@/types";
import { pickActiveEvent } from "@/utils";

/**
 * Evento que muestra este deployment: el más relevante de la organización
 * —en curso, si no el próximo, si no el último que terminó— según
 * `pickActiveEvent`.
 *
 * Antes venía fijo por `EVENTDEX_EVENT_ID` y había que tocar la config del
 * deployment en cada edición. Ahora el deployment se configura una sola vez con
 * la organización y la app sigue el calendario sola.
 *
 * Usa el cliente público (sin cookies) porque son datos públicos: así el fetch
 * es cacheable y sirve tanto al render de la landing como a `generateMetadata`.
 * `cache` lo memoiza por request, para que las varias llamadas de una misma
 * página no repitan la query.
 *
 * Null si la organización no tiene ningún evento publicado con fechas.
 */
export const getActiveEvent = cache(async (): Promise<Event | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("events")
    .select("*, location:event_locations(*), schedules:event_schedules(*)")
    .eq("organization_id", serverEnv.EVENTDEX_ORGANIZATION_ID)
    .eq("status", "ACTIVE")
    .is("deleted_at", null);

  if (error) throw error;

  const event = pickActiveEvent(data ?? []);
  if (!event) return null;

  // Las jornadas se ordenan acá y no en cada vista: PostgREST no garantiza el
  // orden de un recurso embebido, y la landing muestra `schedules[0]` dando por
  // sentado que es la primera.
  return {
    ...event,
    schedules: event.schedules.toSorted((a, b) =>
      a.start_datetime.localeCompare(b.start_datetime),
    ),
  } as Event;
});

/**
 * Id del evento activo, o null si no hay ninguno. Es lo que necesitan las
 * consultas que cuelgan del evento (stands, sorteo), sin traerse todo el resto.
 */
export async function getActiveEventId(): Promise<string | null> {
  return (await getActiveEvent())?.id ?? null;
}

/** Horarios (inicio/fin) de un evento. */
export async function getEventSchedules(eventId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_schedules")
    .select("start_datetime, end_datetime")
    .eq("event_id", eventId);
  return data ?? [];
}
