import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/header";
import { getOrganizationEvent } from "@/server/events";
import { requireMembership } from "@/server/guard";
import { eventPhase, utcToZoned } from "@/utils";
import { EventForm } from "../../_components/event-form";
import { updateEvent } from "../actions";

type EditEventPageProps = Readonly<{ params: Promise<{ id: string }> }>;

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { membership } = await requireMembership();
  const { id } = await params;

  const event = await getOrganizationEvent(membership.organization.id, id);
  if (!event) notFound();

  // Un evento finalizado no se edita. La action valida lo mismo; acá se evita
  // que siquiera se muestre el formulario.
  if (eventPhase(event) === "FINISHED") redirect(`/events/${id}`);

  return (
    <>
      <Header
        items={[
          { label: "Eventos", href: "/events" },
          { label: event.title, href: `/events/${id}` },
          { label: "Editar" },
        ]}
      />

      <main className="flex flex-col gap-6 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold text-2xl tracking-tight">
            Editar evento
          </h2>
          <p className="text-muted-foreground text-sm">
            Los horarios se muestran en la zona horaria del evento.
          </p>
        </div>

        <EventForm
          action={updateEvent.bind(null, id)}
          submitLabel="Guardar cambios"
          cancelHref={`/events/${id}`}
          defaults={{
            title: event.title,
            description: event.description,
            edition: event.edition,
            timezone: event.timezone,
            location: event.location,
            schedules: event.schedules.map((schedule) => ({
              start: utcToZoned(schedule.start_datetime, event.timezone),
              end: utcToZoned(schedule.end_datetime, event.timezone),
            })),
          }}
        />
      </main>
    </>
  );
}
