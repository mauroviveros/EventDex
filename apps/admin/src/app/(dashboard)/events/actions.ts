"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/libs/supabase/service";
import { type EventFormState, parseEventForm } from "@/server/event-form";
import { requireMembership } from "@/server/guard";
import { zonedToUtc } from "@/utils";

/**
 * Crea un evento con su ubicación y su primera jornada.
 *
 * La organización sale de la membresía del usuario, nunca del formulario: es
 * lo que impide crear eventos colgando de una organización ajena.
 *
 * Nace publicado (`ACTIVE`) para que su estado lo determinen las fechas
 * —Próximamente, En vivo o Finalizado— y no quede en un borrador del que
 * todavía no hay forma de salir desde la interfaz.
 */
export async function createEvent(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const { membership } = await requireMembership();
  const { values, errors } = parseEventForm(formData);
  if (!values) return { errors };

  // La hora que escribió el organizador es la del lugar del evento; se guarda
  // en UTC.
  const schedules = values.schedules.map((schedule) => ({
    start_datetime: zonedToUtc(schedule.start, values.timezone),
    end_datetime: zonedToUtc(schedule.end, values.timezone),
  }));

  if (
    schedules.some(
      ({ start_datetime, end_datetime }) => !start_datetime || !end_datetime,
    )
  ) {
    return { errors: { schedule: "No pudimos interpretar esas fechas." } };
  }

  const service = createServiceClient();
  const { data: event, error } = await service
    .from("events")
    .insert({
      organization_id: membership.organization.id,
      title: values.title,
      description: values.description,
      edition: values.edition,
      timezone: values.timezone,
      status: "ACTIVE",
      config: {},
    })
    .select("id")
    .single();

  if (error || !event) {
    return { errors: { _form: "No pudimos crear el evento. Probá de nuevo." } };
  }

  // Ubicación y jornadas van después porque necesitan el id. Si alguna fallara,
  // el evento igual queda creado y visible en el listado.
  const [location, schedule] = await Promise.all([
    service.from("event_locations").insert({
      event_id: event.id,
      ...values.location,
    }),
    service.from("event_schedules").insert(
      schedules.map(({ start_datetime, end_datetime }) => ({
        event_id: event.id,
        start_datetime: start_datetime as string,
        end_datetime: end_datetime as string,
      })),
    ),
  ]);

  if (location.error || schedule.error) {
    return {
      errors: {
        _form:
          "El evento se creó, pero falló la carga de la ubicación o el horario.",
      },
    };
  }

  revalidatePath("/events");
  redirect(`/events/${event.id}`);
}
