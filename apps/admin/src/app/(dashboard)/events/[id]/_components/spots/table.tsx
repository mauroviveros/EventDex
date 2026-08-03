"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import type { EventSpot } from "@/types";
import { spotColumns } from "./columns";

const STATUS_FILTER = {
  column: "status",
  label: "Estado",
  options: [
    { value: "ACTIVE", label: "Activos" },
    { value: "INACTIVE", label: "Inactivos" },
  ],
};

type SpotsTableProps = Readonly<{
  eventId: string;
  spots: EventSpot[];
  /** Un evento terminado no admite altas: sus stands son historia. */
  editable: boolean;
  /** Host donde está publicada la app del evento; sin él no hay QR. */
  domain: string | null;
}>;

export function SpotsTable({
  eventId,
  spots,
  editable,
  domain,
}: SpotsTableProps) {
  const columns = useMemo(
    () => spotColumns(eventId, editable, domain),
    [eventId, editable, domain],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Fuera de la tabla y no en su toolbar: cuando no hay stands, la tabla
          se reemplaza por el mensaje vacío y el botón tiene que seguir ahí. */}
      {editable && (
        <div className="flex justify-end">
          <Button size="sm" asChild>
            <Link href={`/events/${eventId}/spots/new`}>
              <Plus />
              Agregar stand
            </Link>
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={spots}
        label="stands"
        searchColumn="name"
        searchPlaceholder="Buscar stand…"
        filters={[STATUS_FILTER]}
        empty="Este evento todavía no tiene stands cargados."
        urlPrefix="spots"
      />
    </div>
  );
}
