import { Progress } from "@/components/ui/progress";
import type { EventAnalytics } from "@/types";

type FunnelProps = Readonly<{
  funnel: EventAnalytics["funnel"];
  totalSpots: number;
}>;

/**
 * Embudo del recorrido: cuántos visitantes llegaron al menos a N medallas.
 * Es la lectura clave para saber en qué medalla se cae la gente.
 */
export function Funnel({ funnel, totalSpots }: FunnelProps) {
  if (funnel.length === 0) {
    return <p className="text-muted-foreground text-sm">Sin escaneos aún.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {funnel.map((step) => (
        <div key={step.medals} className="grid gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm">
              {step.medals === totalSpots
                ? `Recorrido completo (${step.medals})`
                : `${step.medals}+ medallas`}
            </span>

            <span className="shrink-0 text-sm tabular-nums">
              {step.visitors}{" "}
              <span className="text-muted-foreground">({step.percent}%)</span>
            </span>
          </div>

          <Progress value={step.percent} className="h-1.5" />
        </div>
      ))}
    </div>
  );
}
