import type { OrganizationEvent } from "@/types";
import { EventCard } from "../card";
import { EventsExplorerFilters } from "./filters";

type EventsExplorerProps = Readonly<{ events: OrganizationEvent[] }>;
export function EventsExplorer({ events }: EventsExplorerProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* <EventsExplorerFilters /> */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}
