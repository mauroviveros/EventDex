import type { EventPhase } from "@/types";
import { scheduleRange } from "./dates";

type PhaseInput = {
  status: string | null;
  schedules: { start_datetime: string; end_datetime: string }[];
};

/**
 * Estado real del evento: combina si está publicado con dónde caen sus fechas.
 *
 * - Borrador: no está publicado, o no tiene horarios cargados todavía.
 * - Próximamente / Finalizado: según el rango total de sus jornadas.
 * - En vivo: el ahora cae dentro de ese rango. Se usa el rango completo y no
 *   cada jornada suelta, para que un evento de sábado y domingo no figure como
 *   "finalizado" el sábado a la noche.
 *
 * Se calcula en el servidor y viaja como dato: si lo resolviera el cliente, el
 * texto podría no coincidir con el HTML renderizado.
 */
export function eventPhase(
  { status, schedules }: PhaseInput,
  now = Date.now(),
): EventPhase {
  if (status !== "ACTIVE") return "DRAFT";

  const range = scheduleRange(schedules);
  if (!range) return "DRAFT";

  if (now < Date.parse(range.start)) return "UPCOMING";
  if (now > Date.parse(range.end)) return "FINISHED";
  return "LIVE";
}

/** Orden de los filtros, del estado más "vivo" al más viejo. */
export const EVENT_PHASES: EventPhase[] = [
  "LIVE",
  "UPCOMING",
  "FINISHED",
  "DRAFT",
];

export const EVENT_PHASE_LABELS: Record<EventPhase, string> = {
  LIVE: "En vivo",
  UPCOMING: "Próximamente",
  FINISHED: "Finalizado",
  DRAFT: "Borrador",
};
