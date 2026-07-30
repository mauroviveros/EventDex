import { CalendarDays, QrCode, Store, Users } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EventListItem } from "@/types";

type EventsStatsProps = Readonly<{ events: EventListItem[] }>;

/** Resumen de toda la organización, arriba del listado. */
export function EventsStats({ events }: EventsStatsProps) {
  const sum = (pick: (event: EventListItem) => number) =>
    events.reduce((total, event) => total + pick(event), 0);

  const live = events.filter((event) => event.phase === "LIVE").length;

  const stats = [
    {
      title: "Eventos",
      Icon: CalendarDays,
      value: events.length,
      detail: live ? `${live} en vivo ahora` : "en la organización",
    },
    {
      title: "Stands",
      Icon: Store,
      value: sum((event) => event.count.spots),
      detail: "en todos los eventos",
    },
    {
      title: "Escaneos",
      Icon: QrCode,
      value: sum((event) => event.count.scans),
      detail: "medallas coleccionadas",
    },
    {
      title: "Visitantes",
      Icon: Users,
      value: sum((event) => event.count.participants),
      detail: "únicos por evento",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ title, Icon, value, detail }) => (
        <Card key={title}>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <Icon className="size-4" />
              {title}
            </CardDescription>

            <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
            <CardDescription>{detail}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
