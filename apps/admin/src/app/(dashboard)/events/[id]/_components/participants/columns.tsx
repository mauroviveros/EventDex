"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import type { EventParticipant } from "@/types";
import { formatDateTime, initials } from "@/utils";

/**
 * Columnas de la tabla de visitantes.
 *
 * `totalSpots` sirve para el progreso y para el filtro de completitud;
 * `timezone` para mostrar las fechas en la hora del evento.
 */
export function participantColumns(
  totalSpots: number,
  timezone: string,
): ColumnDef<EventParticipant>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Visitante" />
      ),
      // El buscador matchea nombre o mail: es lo que uno tiene a mano cuando
      // alguien reclama que no le contaron una medalla.
      filterFn: (row, _id, value: string) => {
        const term = value.toLowerCase();
        const { name, email } = row.original;
        return (
          name.toLowerCase().includes(term) ||
          email.toLowerCase().includes(term)
        );
      },
      cell: ({ row }) => {
        const participant = row.original;

        return (
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              {participant.avatar && (
                <AvatarImage src={participant.avatar} alt={participant.name} />
              )}
              <AvatarFallback>{initials(participant.name)}</AvatarFallback>
            </Avatar>

            <div className="grid leading-tight">
              <span className="font-medium">{participant.name}</span>
              <span className="text-muted-foreground text-xs">
                {participant.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: "medals",
      accessorFn: (participant) => participant.count.scans,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Medallas" />
      ),
      filterFn: (row, id, value: string) => {
        const scans = row.getValue<number>(id);
        return value === "complete" ? scans >= totalSpots : scans < totalSpots;
      },
      cell: ({ getValue }) => {
        const scans = getValue<number>();
        const progress = totalSpots
          ? Math.round((scans * 100) / totalSpots)
          : 0;

        return (
          <div className="grid w-32 gap-1.5">
            <span className="text-xs tabular-nums">
              {scans} de {totalSpots}
            </span>
            <Progress value={progress} className="h-1.5" />
          </div>
        );
      },
    },
    {
      accessorKey: "lastScanAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Último escaneo" />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">
          {formatDateTime(getValue<string>(), timezone)}
        </span>
      ),
    },
  ];
}
