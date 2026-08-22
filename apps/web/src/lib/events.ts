import type { Client } from "@eventdex/supabase/astro";

/** El evento que muestra la landing, con todo lo que la página necesita. */
export async function getActiveEvent(supabase: Client, eventId: string) {
  const { data } = await supabase
    .from("events")
    .select(`
      id, title, edition_label, summary, timezone,
      schedules:event_schedules (label, starts_at, ends_at),
      venue:venues (name, address_line, city, state, postal_code, country)
    `)
    .eq("id", eventId)
    .maybeSingle();

  return data;
}
