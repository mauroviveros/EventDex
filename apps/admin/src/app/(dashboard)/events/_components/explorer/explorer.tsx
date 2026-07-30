"use client";

import { useMemo, useState } from "react";
import { useUrlStateReader, useUrlStateWriter } from "@/hooks/use-url-state";
import type { EventListItem, EventPhase } from "@/types";
import { EVENT_PHASES } from "@/utils";
import { EventCard } from "../card";
import { EventsExplorerFilters } from "./filters";

/** Texto sobre el que busca el input: nombre, edición y ubicación. */
const haystack = (event: EventListItem) =>
  [
    event.title,
    event.edition,
    event.location?.address,
    event.location?.city,
    event.location?.country,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

type EventsExplorerProps = Readonly<{ events: EventListItem[] }>;

export function EventsExplorer({ events }: EventsExplorerProps) {
  const readParam = useUrlStateReader();

  const [search, setSearch] = useState(() => readParam("q"));
  const [phase, setPhase] = useState<EventPhase | null>(() => {
    const value = readParam("phase") as EventPhase;
    return EVENT_PHASES.includes(value) ? value : null;
  });

  useUrlStateWriter("", { q: search, phase });

  // Los contadores salen del total, no de lo filtrado: si dependieran del
  // filtro activo, todos los demás mostrarían cero.
  const counts = useMemo(() => {
    const initial = Object.fromEntries(
      EVENT_PHASES.map((option) => [option, 0]),
    ) as Record<EventPhase, number>;

    for (const event of events) initial[event.phase] += 1;
    return initial;
  }, [events]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return events.filter((event) => {
      if (phase && event.phase !== phase) return false;
      return term ? haystack(event).includes(term) : true;
    });
  }, [events, search, phase]);

  return (
    <div className="flex flex-col gap-4">
      <EventsExplorerFilters
        search={search}
        onSearchChange={setSearch}
        phase={phase}
        onPhaseChange={setPhase}
        counts={counts}
        total={events.length}
      />

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed p-12 text-center text-muted-foreground text-sm">
          Ningún evento coincide con la búsqueda.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
