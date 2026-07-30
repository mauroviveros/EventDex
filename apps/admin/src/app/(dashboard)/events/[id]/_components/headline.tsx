import { EventPhaseBadge } from "@/components/event-phase-badge";
import { Badge } from "@/components/ui/badge";
import type { EventDetail } from "@/types";
import { eventPhase, formatDateRange, scheduleRange } from "@/utils";

type EventHeadlineProps = Readonly<{
  event: EventDetail;
  count: { spots: number; visitors: number };
}>;

/**
 * Encabezado del detalle: lo mínimo para saber qué evento se está mirando.
 * El resto de las métricas viven en el tab Resumen.
 */
export function EventHeadline({ event, count }: EventHeadlineProps) {
  const range = scheduleRange(event.schedules);
  const phase = eventPhase(event);

  const meta = [
    range && formatDateRange(range.start, range.end),
    `${count.spots} stands`,
    `${count.visitors} visitantes`,
    event.location?.city,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-semibold text-2xl tracking-tight">{event.title}</h2>

        <EventPhaseBadge phase={phase} />

        {event.edition && <Badge variant="outline">{event.edition}</Badge>}
      </div>

      <p className="text-muted-foreground text-sm">{meta.join(" • ")}</p>
    </div>
  );
}
