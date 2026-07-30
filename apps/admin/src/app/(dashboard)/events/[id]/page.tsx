import { Header } from "@/components/header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getOrganizationEvent } from "@/server/events";
import { getEventSpots } from "@/server/spots";
import { getEventParticipants } from "@/server/participants";
import { requireMembership } from "@/server/guard";
import { notFound } from "next/navigation";
import { ParticipantsTable } from "./_components/participants/table";
import { SpotsTable } from "./_components/spots/table";

type EventDetailPageProps = Readonly<{
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;
export default async function EventDetailPage({ params, searchParams }: EventDetailPageProps) {
  const { membership } = await requireMembership();
  const { id } = await params;
  // const query = await searchParams;
  const event = await getOrganizationEvent(membership.organization.id, id);
  if (!event) notFound();

  const [spots, participants] = await Promise.all([
    getEventSpots(event.id),
    getEventParticipants(event.id),
  ]);

  return (
    <>
      <Header title="Eventos"></Header>

      <main className="flex flex-col gap-6 p-4">
        <Tabs defaultValue="spots">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="spots">Stands</TabsTrigger>
            <TabsTrigger value="participants">Visitantes</TabsTrigger>
            <TabsTrigger value="analytics">Estadísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="spots">
            <SpotsTable eventId={event.id} spots={spots} />
          </TabsContent>

          <TabsContent value="participants">
            <ParticipantsTable
              participants={participants}
              totalSpots={spots.length}
              timezone={event.timezone}
            />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
