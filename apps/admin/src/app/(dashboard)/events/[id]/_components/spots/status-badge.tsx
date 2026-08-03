import { Badge } from "@/components/ui/badge";
import type { Enums } from "@/types";
import { setSpotStatus } from "../../spots/actions";

const LABELS: Record<Enums<"SPOT_STATUS">, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
};

type SpotStatusBadgeProps = Readonly<{
  eventId: string;
  spotId: string;
  status: Enums<"SPOT_STATUS">;
  /** En un evento finalizado el estado ya no se cambia: es solo la etiqueta. */
  editable: boolean;
}>;

/**
 * Badge de estado que además es el toggle: un form con la server action
 * bindeada, así el switch funciona sin JavaScript de cliente.
 */
export function SpotStatusBadge({
  eventId,
  spotId,
  status,
  editable,
}: SpotStatusBadgeProps) {
  const variant = status === "ACTIVE" ? "default" : "secondary";
  const next = status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  if (!editable) return <Badge variant={variant}>{LABELS[status]}</Badge>;

  return (
    <form action={setSpotStatus.bind(null, eventId, spotId, next)}>
      <Badge asChild variant={variant} className="cursor-pointer">
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
