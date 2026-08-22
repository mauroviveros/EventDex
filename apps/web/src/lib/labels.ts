import type { Enums } from "@eventdex/db";

/**
 * Traducciones de los enums de la base al español de la interfaz.
 *
 * El tipo es `Record<Enums<...>, string>` y no un objeto suelto con `as const`:
 * si una migración agrega un valor al enum —un `spot_type` nuevo, por ejemplo—
 * este archivo deja de compilar hasta que lo traduzcas.
 *
 * Con `as const` en la página, ese mismo cambio de esquema aparecía como un
 * `undefined` silencioso en pantalla. La ganancia acá no es no repetirse: es la
 * exhaustividad.
 */

export const PHASE_LABEL: Record<Enums<"event_phase">, string> = {
  upcoming: "Próximamente",
  live: "En curso",
  finished: "Finalizado",
};

export const SPOT_TYPE_LABEL: Record<Enums<"spot_type">, string> = {
  stand: "Stand",
  attraction: "Atracción",
  sponsor: "Sponsor",
  activity: "Actividad",
};
