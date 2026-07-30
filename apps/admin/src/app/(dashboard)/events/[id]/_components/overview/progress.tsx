import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { EventOverview } from "@/types";

type EventProgressProps = Readonly<{ progress: EventOverview["progress"] }>;

export function EventProgress({ progress }: EventProgressProps) {
  const bars = [
    {
      label: "Recorrido completo",
      bar: progress.completed,
      unit: "visitantes",
      detail: "juntaron todas las medallas",
    },
    {
      label: "Cobertura de stands",
      bar: progress.coverage,
      unit: "stands",
      detail: "con al menos un escaneo",
    },
    {
      label: "Medallas promedio",
      bar: progress.averageMedals,
      unit: "medallas",
      detail: "por visitante, sobre el total posible",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progreso del evento</CardTitle>
        <CardDescription>Sobre el total de stands cargados.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {bars.map(({ label, bar, unit, detail }) => (
          <div key={label} className="grid gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm">{label}</span>

              <span className="shrink-0 font-medium text-sm tabular-nums">
                {bar.percent}%{" "}
                <span className="font-normal text-muted-foreground">
                  ({bar.value}/{bar.total})
                </span>
              </span>
            </div>

            <Progress value={bar.percent} className="h-1.5" />

            <span className="text-muted-foreground text-xs">
              {bar.value} de {bar.total} {unit} {detail}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
