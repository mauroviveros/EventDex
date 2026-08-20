import type { Enums, Json } from "@eventdex/db";

export type SpotType = Enums<"spot_type">;
export type EventSpotStatus = Enums<"event_spot_status">;

/** Forma del JSONB que congela `publish_event()`. */
export interface SpotSnapshot {
  name: string;
  description: string | null;
  avatar_path: string | null;
  type: SpotType;
  frozen_at: string;
}

/** Los campos presentables, ya resueltos. */
export interface SpotPresentation {
  name: string;
  description: string | null;
  avatar_path: string | null;
  type: SpotType;
}

/** Lo que aporta la RELACIÓN (event_spots). */
export interface EventSpotOverrides {
  name_override: string | null;
  description_override: string | null;
  avatar_path_override: string | null;
  snapshot: Json | null;
}

/** Lo que aporta el CATÁLOGO (spots). */
export type CatalogSpot = SpotPresentation;

/**
 * Un override en blanco NO es un override.
 *
 * Esta es la trampa del `??`: solo cae al siguiente valor con null o undefined,
 * así que un `name_override = ""` —que es lo que manda un formulario cuando el
 * usuario borra el campo— se considera un override válido y el spot termina
 * renderizando con nombre vacío. Tratar el blanco como ausente es la semántica
 * correcta: "no hay override de esta edición".
 *
 * El formulario del admin también debería normalizar "" → null antes de
 * guardar, para que la base quede limpia. Esto es la red por si no lo hace.
 */
function present(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * `snapshot` es `jsonb`, o sea `Json` para TypeScript: una unión que incluye
 * string, number y array. Sin este chequeo no se puede leer `.name` sin un
 * cast a ciegas. Devuelve `Partial` a propósito: verificamos que sea un objeto,
 * no que tenga los campos.
 */
export function parseSnapshot(value: Json | null): Partial<SpotSnapshot> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Partial<SpotSnapshot>;
}

export function resolveSpot(eventSpot: EventSpotOverrides, catalog: CatalogSpot): SpotPresentation {
  const snapshot = parseSnapshot(eventSpot.snapshot);

  return {
    name: present(eventSpot.name_override) ?? present(snapshot?.name) ?? catalog.name,
    description:
      present(eventSpot.description_override) ??
      present(snapshot?.description) ??
      catalog.description,
    avatar_path:
      present(eventSpot.avatar_path_override) ??
      present(snapshot?.avatar_path) ??
      catalog.avatar_path,
    // `type` no tiene columna de override: no es un dato de presentación de la
    // edición, es qué ES el spot. Solo puede venir congelado o del catálogo.
    type: snapshot?.type ?? catalog.type,
  };
}
