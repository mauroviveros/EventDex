import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, ChartColumn, MapPin, Megaphone, QrCode, Store, Users } from "lucide-react";
import type { OrganizationEvent } from "@/types";
import Link from "next/link";

type EventsExplorerProps = Readonly<{ event: OrganizationEvent }>;
export function EventCard({ event }: EventsExplorerProps) {
  const { title, edition, count, location,  } = event;
  const metrics = [
    { label: "Stands", Icon: Store, value: count.spots },
    { label: "Visitantes", Icon: Users, value: count.participants },
    { label: "Escaneos", Icon: QrCode, value: count.scans },
  ];

  const capacity = Math.round((count.scans * 100) / (count.spots * count.participants));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold leading-tight truncate group-hover/card:text-primary transition-colors">
          {title}
        </CardTitle>

        <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="flex items-center gap-1">
            <Megaphone className="size-3" />
            {edition}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3" />
            {location?.address}, {location?.country}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <article className="grid grid-cols-3 gap-2">
          {metrics.map(({ label, Icon, value }, index) => (
            <div key={index} className="rounded-lg border border-border/60 bg-muted/30 p-2">
              <span className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                <Icon className="size-3" />
                {label}
              </span>

              <p className="text-sm font-semibold mt-0.5">{value}</p>
            </div>
          ))}
        </article>

        <article className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Capacidad</span>
            <span className="font-medium">{capacity}%</span>
          </div>

          <Progress value={capacity} className="h-1.5" />
        </article>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Button variant="outline" size="sm" className="w-full flex-none sm:flex-1" asChild>
          <Link href={`/events/${event.id}`}>
            <ChartColumn />
            Estadísticas
          </Link>
        </Button>

        <Button size="sm" className="w-full flex-none sm:flex-1" asChild>
          <Link href={`/events/${event.id}`}>
            Gestionar
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
