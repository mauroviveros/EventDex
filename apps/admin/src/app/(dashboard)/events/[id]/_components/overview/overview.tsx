import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EventOverview } from "@/types";
import { formatDateRange } from "@/utils";
import { ActivityChart } from "./activity-chart";
import { EventProgress } from "./progress";
import { RecentActivity } from "./recent-activity";
import { OverviewStats } from "./stats";
import { TopParticipants } from "./top-participants";
import { TopSpots } from "./top-spots";

type OverviewProps = Readonly<{ overview: EventOverview }>;

export function Overview({ overview }: OverviewProps) {
  const { totals, activity, peak, day } = overview;

  return (
    <div className="flex flex-col gap-4">
      <OverviewStats totals={totals} />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Actividad por hora</CardTitle>
            <CardDescription>
              {day
                ? `Jornada más movida: ${formatDateRange(day, day)}, en la zona del evento.`
                : "Todavía no hay escaneos."}
            </CardDescription>

            {peak && (
              <CardAction className="text-muted-foreground text-sm">
                Pico {peak.label} · {peak.scans} escaneos
              </CardAction>
            )}
          </CardHeader>

          <CardContent>
            {activity.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground text-sm">
                Sin escaneos para graficar.
              </p>
            ) : (
              <ActivityChart data={activity} />
            )}
          </CardContent>
        </Card>

        <EventProgress progress={overview.progress} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <TopSpots spots={overview.topSpots} total={totals.spots} />
        <TopParticipants
          participants={overview.topParticipants}
          total={totals.visitors}
          totalSpots={totals.spots}
        />
        <RecentActivity recent={overview.recent} />
      </div>
    </div>
  );
}
