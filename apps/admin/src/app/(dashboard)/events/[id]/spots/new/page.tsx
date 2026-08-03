import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/header";
import { getOrganizationEvent } from "@/server/events";
import { requireMembership } from "@/server/guard";
import { eventPhase } from "@/utils";
import { SpotForm } from "../_components/spot-form";
import { createSpot } from "../actions";

type NewSpotPageProps = Readonly<{ params: Promise<{ id: string }> }>;

export default async function NewSpotPage({ params }: NewSpotPageProps) {
  const { membership } = await requireMembership();
  const { id } = await params;

  const event = await getOrganizationEvent(membership.organization.id, id);
  if (!event) notFound();

  // A un evento finalizado no se le agregan stands. La action valida lo mismo;
  // acá se evita que siquiera se muestre el formulario.
  if (eventPhase(event) === "FINISHED") redirect(`/events/${id}`);

  return (
    <>
      <Header
        items={[
          { label: "Eventos", href: "/events" },
          { label: event.title, href: `/events/${id}` },
          { label: "Nuevo stand" },
        ]}
      />

      <main className="flex flex-col gap-6 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold text-2xl tracking-tight">
            Agregar stand
          </h2>
          <p className="text-muted-foreground text-sm">
            La imagen es la medalla que el visitante suma al escanear el QR del
            stand.
          </p>
        </div>

        <SpotForm
          action={createSpot.bind(null, id)}
          submitLabel="Agregar stand"
          cancelHref={`/events/${id}#spots`}
        />
      </main>
    </>
  );
}
