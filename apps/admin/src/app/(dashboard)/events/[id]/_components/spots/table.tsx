"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/data-table";
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

type SpotsTableProps = Readonly<{ eventId: string; spots: EventSpot[] }>;
export function SpotsTable({ eventId, spots }: SpotsTableProps) {
  const columns = useMemo(() => spotColumns(eventId), [eventId]);

  return (
    <DataTable
      columns={columns}
      data={spots}
      label="stands"
      searchColumn="name"
      searchPlaceholder="Buscar stand…"
      filters={[STATUS_FILTER]}
      empty="Este evento todavía no tiene stands cargados."
    />
  );
}
