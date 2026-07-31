"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/libs/supabase/service";
import { type EventFormState, parseEventForm } from "@/server/event-form";
import { getOrganizationEvent } from "@/server/events";
import { requireMembership } from "@/server/guard";
import type { Enums } from "@/types";
import { eventPhase, zonedToUtc } from "@/utils";

/**
 * Un evento finalizado es historia: sus datos quedan como respaldo de los
 * escaneos que ya ocurrieron. El bloqueo se repite acá y no solo en la
 * interfaz, porque la interfaz se puede saltear.
 */
async function requireEditableEvent(eventId: string) {
  const { membership } = await requireMembership();
  const event = await getOrganizationEvent(membership.organization.id, eventId);

  if (!event) redirect("/events");
  if (eventPhase(event) === "FINISHED") redirect(`/events/${eventId}`);

  return { event, service: createServiceClient() };
}

/** Guarda los cambios del evento, su ubicación y sus jornadas. */
export async function updateEvent(
  eventId: string,
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const { service } = await requireEditableEvent(eventId);

  const { values, errors } = parseEventForm(formData);
  if (!values) return { errors };

  const schedules = values.schedules.map((schedule) => ({
    event_id: eventId,
    start_datetime: zonedToUtc(schedule.start, values.timezone),
    end_datetime: zonedToUtc(schedule.end, values.timezone),
  }));

  if (schedules.some((row) => !row.start_datetime || !row.end_datetime)) {
    return { errors: { schedule: "No pudimos interpretar esas fechas." } };
  }

  const { error } = await service
    .from("events")
    .update({
      title: values.title,
      description: values.description,
      edition: values.edition,
      timezone: values.timezone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (error) {
    return { errors: { _form: "No pudimos guardar los cambios." } };
  }

  await service
    .from("event_locations")
    .upsert(
      { event_id: eventId, ...values.location },
      { onConflict: "event_id" },
    );

  // Las jornadas se reemplazan: primero se insertan las nuevas y recién
  // después se borran las viejas, para que un fallo no deje al evento sin
  // ninguna (que lo mostraría como borrador).
  const { data: previous } = await service
    .from("event_schedules")
    .select("id")
    .eq("event_id", eventId);

  const inserted = await service.from("event_schedules").insert(
    schedules.map((row) => ({
      event_id: row.event_id,
      start_datetime: row.start_datetime as string,
      end_datetime: row.end_datetime as string,
    })),
  );

  if (inserted.error) {
    return { errors: { schedule: "No pudimos guardar las jornadas." } };
  }

  if (previous?.length) {
    await service
      .from("event_schedules")
      .delete()
      .in(
        "id",
        previous.map((row) => row.id),
      );
  }

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  redirect(`/events/${eventId}`);
}

/**
 * Baja lógica del evento: deja de listarse pero sus escaneos y stands quedan
 * en la base. Un borrado real arrastraría el historial de los visitantes.
 */
export async function deleteEvent(eventId: string) {
  const { membership } = await requireMembership();
  const service = createServiceClient();

  const { data: event } = await service
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("organization_id", membership.organization.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!event) redirect("/events");

  await service
    .from("events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", eventId);

  revalidatePath("/events");
  redirect("/events");
}

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
