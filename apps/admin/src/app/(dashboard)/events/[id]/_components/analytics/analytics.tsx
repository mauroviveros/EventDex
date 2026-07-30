import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EventAnalytics } from "@/types";
import {
  ArrivalsChart,
  CumulativeChart,
  DistributionChart,
  PerDayChart,
  SpotsChart,
} from "./charts";
import { Funnel } from "./funnel";
import { Heatmap } from "./heatmap";

type AnalyticsProps = Readonly<{
  analytics: EventAnalytics;
  totalSpots: number;
}>;

export function Analytics({ analytics, totalSpots }: AnalyticsProps) {
  const { timeline, perDay, perSpot, distribution, funnel, heatmap } =
    analytics;

  if (timeline.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-12 text-center text-muted-foreground text-sm">
        Todavía no hay escaneos para analizar.
      </p>
    );
  }

  const busiestArrival = timeline.reduce((best, point) =>
    point.newVisitors > best.newVisitors ? point : best,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Llegadas por hora</CardTitle>
            <CardDescription>
              Cuándo entró la gente: cada visitante cuenta en la hora de su
              primer escaneo.
            </CardDescription>
            <CardAction className="text-muted-foreground text-sm">
              Pico {busiestArrival.label} · {busiestArrival.newVisitors}
            </CardAction>
          </CardHeader>
          <CardContent>
            <ArrivalsChart data={timeline} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acumulado</CardTitle>
            <CardDescription>
              Escaneos contra visitantes. Cuanto más se separan las curvas, más
              stands recorrió cada persona.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CumulativeChart data={timeline} />
          </CardContent>
        </Card>
      </div>

      {perDay.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Por jornada</CardTitle>
            <CardDescription>
              Escaneos y visitantes únicos de cada día.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PerDayChart data={perDay} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Escaneos por stand</CardTitle>
            <CardDescription>
              Cada visitante puede escanear un stand una sola vez, así que esto
              también es cuánta gente pasó por cada uno.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SpotsChart data={perSpot} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Embudo del recorrido</CardTitle>
            <CardDescription>
              Visitantes que llegaron al menos a cada cantidad de medallas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Funnel funnel={funnel} totalSpots={totalSpots} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribución de medallas</CardTitle>
          <CardDescription>
            Cuántos visitantes juntaron exactamente esa cantidad. La barra
            destacada es el recorrido completo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DistributionChart data={distribution} totalSpots={totalSpots} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stands por hora</CardTitle>
          <CardDescription>
            Dónde se concentró la gente en cada franja horaria, sumando todas
            las jornadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Heatmap heatmap={heatmap} />
        </CardContent>
      </Card>
    </div>
  );
}
