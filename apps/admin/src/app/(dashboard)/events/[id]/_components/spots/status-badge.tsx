import { Badge } from "@/components/ui/badge";
import type { Enums } from "@/types";
import { setSpotStatus } from "../../actions";

const LABELS: Record<Enums<"SPOT_STATUS">, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
};

type SpotStatusBadgeProps = Readonly<{
  eventId: string;
  spotId: string;
  status: Enums<"SPOT_STATUS">;
}>;

/**
 * Badge de estado que además es el toggle: un form con la server action
 * bindeada, así el switch funciona sin JavaScript de cliente.
 */
export function SpotStatusBadge({
  eventId,
  spotId,
  status,
}: SpotStatusBadgeProps) {
  const next = status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  return (
    <form action={setSpotStatus.bind(null, eventId, spotId, next)}>
      <Badge
        asChild
        variant={status === "ACTIVE" ? "default" : "secondary"}
        className="cursor-pointer"
      >
        <button
          type="submit"
          title={`Marcar como ${LABELS[next].toLowerCase()}`}
        >
          {LABELS[status]}
        </button>
      </Badge>
    </form>
  );
}
