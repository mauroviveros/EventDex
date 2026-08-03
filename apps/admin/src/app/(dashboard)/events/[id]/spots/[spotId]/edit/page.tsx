import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/header";
import { getOrganizationEvent } from "@/server/events";
import { requireMembership } from "@/server/guard";
import { getEventSpot } from "@/server/spots";
import { eventPhase } from "@/utils";
import { SpotForm } from "../../_components/spot-form";
import { updateSpot } from "../../actions";

type EditSpotPageProps = Readonly<{
  params: Promise<{ id: string; spotId: string }>;
}>;

export default async function EditSpotPage({ params }: EditSpotPageProps) {
  const { membership } = await requireMembership();
  const { id, spotId } = await params;

  // El evento se valida contra la organización antes de leer el stand: es lo
  // que impide editar stands de otra organización pasando su id.
  const event = await getOrganizationEvent(membership.organization.id, id);
  if (!event) notFound();

  if (eventPhase(event) === "FINISHED") redirect(`/events/${id}`);

  const spot = await getEventSpot(id, spotId);
  if (!spot) notFound();

  return (
    <>
      <Header
        items={[
          { label: "Eventos", href: "/events" },
          { label: event.title, href: `/events/${id}` },
          { label: spot.name },
        ]}
      />

      <main className="flex flex-col gap-6 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold text-2xl tracking-tight">
            Editar stand
          </h2>
          <p className="text-muted-foreground text-sm">
            Los cambios se ven en la app del evento apenas se guardan.
          </p>
        </div>

        <SpotForm
          action={updateSpot.bind(null, id, spotId)}
          submitLabel="Guardar cambios"
          cancelHref={`/events/${id}#spots`}
          defaults={{
            name: spot.name,
            description: spot.description,
            location: spot.location,
            type: spot.type,
            avatarUrl: spot.avatarUrl,
          }}
        />
      </main>
    </>
  );
}
