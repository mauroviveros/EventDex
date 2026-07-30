import { Badge } from "@/components/ui/badge";
import type { EventPhase } from "@/types";
import { cn, EVENT_PHASE_LABELS } from "@/utils";

/**
 * Jerarquía visual dentro de la paleta monocroma del dashboard: lo que está
 * pasando ahora pesa más, el borrador es el más tenue (y va punteado, para
 * distinguirse de "finalizado" sin recurrir al color).
 */
const VARIANTS: Record<
  EventPhase,
  { variant: "default" | "secondary" | "outline"; className?: string }
> = {
  LIVE: { variant: "default" },
  UPCOMING: { variant: "secondary" },
  FINISHED: { variant: "outline" },
  DRAFT: {
    variant: "outline",
    className: "border-dashed text-muted-foreground",
  },
};

type EventPhaseBadgeProps = Readonly<{ phase: EventPhase; className?: string }>;

export function EventPhaseBadge({ phase, className }: EventPhaseBadgeProps) {
  const { variant, className: phaseClassName } = VARIANTS[phase];

  return (
    <Badge variant={variant} className={cn(phaseClassName, className)}>
      {EVENT_PHASE_LABELS[phase]}
    </Badge>
  );
}
