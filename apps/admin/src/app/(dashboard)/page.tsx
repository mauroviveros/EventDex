import { Header } from "@/components/header"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getOrganizationEvents } from "@/server/events";
import { requireMembership } from "@/server/guard";
import { CalendarDays, MapPin, ScanLine, Users } from "lucide-react";

export default async function DashboardPage(){
  const { membership } = await requireMembership();
  const events = await getOrganizationEvents(membership.organization.id);

  const stats = [
    {
      title: "Eventos",
      Icon: CalendarDays,
      value: events.length,
      detail: `en la organización`,
    },
    {
      title: "Spots",
      Icon: MapPin,
      value: events.reduce((sum, { count }) => sum + count.spots, 0),
      detail: "en todos los eventos",
    },
    {
      title: "Escaneos",
      Icon: ScanLine,
      value: events.reduce((sum, { count }) => sum + count.scans, 0),
      detail: "medallas coleccionadas",
    },
    {
      title: "Participantes",
      Icon: Users,
      value: events.reduce((sum, { count }) => sum + count.participants, 0),
      detail: "únicos por evento",
    },
  ];

  return (
    <>
      <Header title="Dashboard" />
      <main className="flex flex-col gap-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ title, Icon, value, detail }) => (
            <Card key={title}>
              <CardHeader>
                <CardDescription className="flex items-center gap-2">
                  <Icon className="size-4" />
                  {title}
                </CardDescription>

                <CardTitle className="text-3xl tabular-nums">
                  {value}
                </CardTitle>

                <CardDescription>{detail}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
    </>
  )
}
