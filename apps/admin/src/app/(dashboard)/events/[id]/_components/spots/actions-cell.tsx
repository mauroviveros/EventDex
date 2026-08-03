"use client";

import { QrCode, SquarePen, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { deleteSpot } from "../../spots/actions";

/**
 * Botón deshabilitado con su explicación. El span envuelve al botón porque un
 * botón deshabilitado no emite eventos de mouse y el tooltip nunca se
 * mostraría.
 */
function DisabledAction({
  label,
  reason,
  children,
}: Readonly<{ label: string; reason: string; children: React.ReactNode }>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button variant="ghost" size="icon" aria-label={label} disabled>
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}

type SpotActionsCellProps = Readonly<{
  eventId: string;
  spotId: string;
  name: string;
  scans: number;
  editable: boolean;
}>;

/** Acciones por stand: editar, ver su QR (pendiente) y darlo de baja. */
export function SpotActionsCell({
  eventId,
  spotId,
  name,
  scans,
  editable,
}: SpotActionsCellProps) {
  const finished = "Un evento finalizado no se puede editar.";

  return (
    <div className="flex justify-end gap-1">
      {editable ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Editar stand"
              asChild
            >
              <Link href={`/events/${eventId}/spots/${spotId}/edit`}>
                <SquarePen />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Editar</TooltipContent>
        </Tooltip>
      ) : (
        <DisabledAction label="Editar stand" reason={finished}>
          <SquarePen />
        </DisabledAction>
      )}

      <DisabledAction label="Ver QR" reason="Ver QR (próximamente)">
        <QrCode />
      </DisabledAction>

      {editable ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Eliminar stand">
              <Trash2 />
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar “{name}”?</AlertDialogTitle>
              <AlertDialogDescription>
                Deja de aparecer en el dashboard y su QR no vuelve a entregar
                medallas.{" "}
                {scans > 0
                  ? `Es una baja lógica: los ${scans} escaneos que ya tuvo quedan en la base, pero dejan de contar en las métricas del evento.`
                  : "Es una baja lógica: la ficha queda guardada, solo deja de usarse."}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteSpot(eventId, spotId)}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <DisabledAction label="Eliminar stand" reason={finished}>
          <Trash2 />
        </DisabledAction>
      )}
    </div>
  );
}
