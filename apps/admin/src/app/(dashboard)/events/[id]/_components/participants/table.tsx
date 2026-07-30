"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/data-table";
import type { EventParticipant } from "@/types";
import { participantColumns } from "./columns";

const MEDALS_FILTER = {
  column: "medals",
  label: "Medallas",
  options: [
    { value: "complete", label: "Completaron todas" },
    { value: "partial", label: "En progreso" },
  ],
};

type ParticipantsTableProps = Readonly<{
  participants: EventParticipant[];
  /** Total de stands del evento, para el progreso de medallas. */
  totalSpots: number;
  /** Zona horaria del evento: las fechas se muestran en la hora del lugar. */
  timezone: string;
}>;

export function ParticipantsTable({
  participants,
  totalSpots,
  timezone,
}: ParticipantsTableProps) {
  const columns = useMemo(
    () => participantColumns(totalSpots, timezone),
    [totalSpots, timezone],
  );

  return (
    <DataTable
      columns={columns}
      data={participants}
      label="visitantes"
      searchColumn="name"
      searchPlaceholder="Buscar por nombre o mail…"
      filters={[MEDALS_FILTER]}
      empty="Todavía nadie escaneó un stand de este evento."
      urlPrefix="visitors"
    />
  );
}
