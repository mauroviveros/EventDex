import { Plus } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { getOrganizationEvents } from "@/server/events";
import { requireMembership } from "@/server/guard";
import { eventPhase } from "@/utils";
import { EventsExplorer } from "./_components/explorer/explorer";
import { EventsStats } from "./_components/stats";

export default async function EventsPage() {
  const { membership } = await requireMembership();
  const events = await getOrganizationEvents(membership.organization.id);

  // El estado se resuelve acá, en el servidor: el listado filtra por un valor
  // ya calculado y no depende del reloj del navegador.
  const items = events.map((event) => ({
    ...event,
    phase: eventPhase(event),
  }));

  return (
    <>
      <Header items={[{ label: "Eventos" }]}>
        <Button size="sm">
          <Plus />
          Crear evento
        </Button>
      </Header>

      <main className="flex flex-col gap-6 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold text-2xl tracking-tight">
            {membership.organization.name}
          </h2>
          <p className="text-muted-foreground text-sm">
            Administrá tus eventos presenciales, sus stands y el recorrido de
            los visitantes.
          </p>
        </div>

        <EventsStats events={items} />
        <EventsExplorer events={items} />
      </main>
    </>
  );
}
