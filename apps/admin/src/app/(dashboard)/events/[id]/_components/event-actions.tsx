"use client";

import { Pencil, Trash2 } from "lucide-react";
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
import type { EventPhase } from "@/types";
import { deleteEvent } from "../actions";

type EventActionsProps = Readonly<{
  eventId: string;
  title: string;
  phase: EventPhase;
}>;

export function EventActions({ eventId, title, phase }: EventActionsProps) {
  const finished = phase === "FINISHED";

  return (
    <div className="flex items-center gap-2">
      {finished ? (
        <Tooltip>
          {/* El span envuelve al botón deshabilitado: sin él no emite eventos
              de mouse y el tooltip nunca se mostraría. */}
          <TooltipTrigger asChild>
            <span>
              <Button variant="outline" size="sm" disabled>
                <Pencil />
                Editar
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Un evento finalizado no se puede editar.
          </TooltipContent>
        </Tooltip>
      ) : (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/events/${eventId}/edit`}>
            <Pencil />
            Editar
          </Link>
        </Button>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Eliminar evento">
            <Trash2 />
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar “{title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Deja de aparecer en el dashboard. Es una baja lógica: los escaneos
              y los stands quedan guardados, así que el historial de los
              visitantes no se pierde.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteEvent(eventId)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
