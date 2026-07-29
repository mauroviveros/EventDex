import { Plus } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { EventsExplorer } from "./_components/explorer/explorer";
import { requireMembership } from "@/server/guard";
import { getOrganizationEvents } from "@/server/events";

export default async function EventsPage() {
  const { membership } = await requireMembership();
  const events = await getOrganizationEvents(membership.organization.id);

  return (
    <>
      <Header title="Eventos">
        <Button size="sm">
          <Plus />
          Crear evento
        </Button>
      </Header>

      <main className="flex flex-col gap-6 p-4">
        <EventsExplorer events={events} />
      </main>
    </>
  );
}
