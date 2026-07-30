import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { buildEventAnalytics } from "@/server/analytics";
import { getOrganizationEvent } from "@/server/events";
import { requireMembership } from "@/server/guard";
import { buildEventOverview } from "@/server/overview";
import { getEventParticipants } from "@/server/participants";
import { getEventScans } from "@/server/scans";
import { getEventSpots } from "@/server/spots";
import { Analytics } from "./_components/analytics/analytics";
import { EventHeadline } from "./_components/headline";
import { Overview } from "./_components/overview/overview";
import { ParticipantsTable } from "./_components/participants/table";
import { SpotsTable } from "./_components/spots/table";
import { EventTabs } from "./_components/tabs";

type EventDetailPageProps = Readonly<{ params: Promise<{ id: string }> }>;
export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { membership } = await requireMembership();
  const { id } = await params;
  const event = await getOrganizationEvent(membership.organization.id, id);
  if (!event) notFound();

  const [spots, participants] = await Promise.all([
    getEventSpots(event.id),
    getEventParticipants(event.id),
  ]);

  // Los escaneos se leen una sola vez: el resumen y las estadísticas son dos
  // derivaciones puras de las mismas filas.
  const scans = await getEventScans(spots.map((spot) => spot.id));
  const derived = { scans, spots, participants, timezone: event.timezone };

  const overview = buildEventOverview(derived);
  const analytics = buildEventAnalytics(derived);

  return (
    <>
      <Header
        items={[{ label: "Eventos", href: "/events" }, { label: event.title }]}
      />

      <main className="flex flex-col gap-6 p-4">
        <EventHeadline
          event={event}
          count={{ spots: spots.length, visitors: participants.length }}
        />

        <EventTabs
          overview={<Overview overview={overview} />}
          spots={<SpotsTable eventId={event.id} spots={spots} />}
          participants={
            <ParticipantsTable
              participants={participants}
              totalSpots={spots.length}
              timezone={event.timezone}
            />
          }
          analytics={
            <Analytics analytics={analytics} totalSpots={spots.length} />
          }
        />
      </main>
    </>
  );
}
