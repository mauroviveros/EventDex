import { QrCode, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ACTIONS = [
  { label: "Ver detalle / modificar", Icon: SquarePen },
  { label: "Ver QR", Icon: QrCode },
];

/**
 * Acciones por stand. Todavía deshabilitadas: el detalle del spot y el QR
 * llegan en la próxima iteración. El span envuelve al botón porque un botón
 * deshabilitado no emite eventos de mouse y el tooltip nunca se mostraría.
 */
export function SpotActionsCell() {
  return (
    <div className="flex justify-end gap-1">
      {ACTIONS.map(({ label, Icon }) => (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <span>
              <Button variant="ghost" size="icon" aria-label={label}>
                <Icon />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{label} (próximamente)</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
