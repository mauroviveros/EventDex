"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import type { EventPhase } from "@/types";
import { EVENT_PHASE_LABELS, EVENT_PHASES } from "@/utils";

type EventsExplorerFiltersProps = Readonly<{
  search: string;
  onSearchChange: (value: string) => void;
  phase: EventPhase | null;
  onPhaseChange: (phase: EventPhase | null) => void;
  /** Cuántos eventos hay en cada estado: los vacíos quedan deshabilitados. */
  counts: Record<EventPhase, number>;
  total: number;
}>;

export function EventsExplorerFilters({
  search,
  onSearchChange,
  phase,
  onPhaseChange,
  counts,
  total,
}: EventsExplorerFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <InputGroup className="flex-1">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          placeholder="Buscar por nombre o ubicación..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </InputGroup>

      <ButtonGroup className="flex-wrap">
        <Button
          variant={phase === null ? "default" : "outline"}
          size="sm"
          onClick={() => onPhaseChange(null)}
        >
          Todos
          <span className="text-xs tabular-nums opacity-70">{total}</span>
        </Button>

        {EVENT_PHASES.map((option) => (
          <Button
            key={option}
            variant={phase === option ? "default" : "outline"}
            size="sm"
            disabled={counts[option] === 0}
            onClick={() => onPhaseChange(option)}
          >
            {EVENT_PHASE_LABELS[option]}
            <span className="text-xs tabular-nums opacity-70">
              {counts[option]}
            </span>
          </Button>
        ))}
      </ButtonGroup>
    </div>
  );
}
