"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { EventSpot } from "@/types";
import { initials, spotPublicUrl } from "@/utils";
import { SpotActionsCell } from "./actions-cell";
import { SpotStatusBadge } from "./status-badge";

const TYPES: Record<string, string> = {
  LOCAL: "Local",
  ATTRACTION: "Atracción",
};

/**
 * Columnas de la tabla de stands. El eventId lo necesitan el toggle de estado
 * y los links de la fila; `editable` es false en un evento finalizado, donde
 * los stands solo se miran; `domain` es el host de la organización, con el que
 * se arma el link que va impreso en cada QR.
 */
export function spotColumns(
  eventId: string,
  editable: boolean,
  domain: string | null,
): ColumnDef<EventSpot>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stand" />
      ),
      cell: ({ row }) => {
        const spot = row.original;

        return (
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarImage src={spot.avatarUrl} alt={spot.name} />
              <AvatarFallback>{initials(spot.name)}</AvatarFallback>
            </Avatar>

            <div className="grid leading-tight">
              <span className="font-medium">{spot.name}</span>
              {spot.type && (
                <span className="text-muted-foreground text-xs">
                  {TYPES[spot.type] ?? spot.type}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "scans",
      accessorFn: (spot) => spot.count.scans,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Escaneos" />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Estado" />
      ),
      // Igualdad exacta: el select del toolbar manda "ACTIVE" o "INACTIVE".
      filterFn: (row, id, value) => row.getValue(id) === value,
      cell: ({ row }) => (
        <SpotStatusBadge
          eventId={eventId}
          spotId={row.original.id}
          status={row.original.status}
          editable={editable}
        />
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => (
        <SpotActionsCell
          eventId={eventId}
          spotId={row.original.id}
          name={row.original.name}
          scans={row.original.count.scans}
          editable={editable}
          url={spotPublicUrl(domain, row.original.id)}
        />
      ),
    },
  ];
}
