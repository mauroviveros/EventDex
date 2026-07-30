import type { Enums, Tables } from "@eventdex/database";

// Re-exporta el paquete de tipos compartido. Mantener `@/types` como punto de
// entrada evita tocar los imports de la app si el paquete cambia de estructura.
export * from "@eventdex/database";

/** Membresía del usuario en una organización, o null si no es organizador. */
export type Membership = {
  role: Enums<"ORGANIZATION_MEMBER_ROLE">;
  organization: Pick<Tables<"organizations">, "id" | "name" | "slug">;
};

/** Evento de la organización con sus métricas básicas (spots, escaneos, participantes únicos). */
export type OrganizationEvent = Pick<Tables<"events">, "id" | "title" | "edition" | "status" | "timezone"> & {
  location: Pick<Tables<"event_locations">, "city" | "country" | "address"> | null;
  schedules: Pick<Tables<"event_schedules">, "start_datetime" | "end_datetime">[];
  range: { start: string; end: string } | null;
  count: { spots: number; scans: number; participants: number; };
};

/** Evento con su ubicación y horarios, para la vista de detalle. */
export type EventDetail = Tables<"events"> & {
  location: Tables<"event_locations"> | null;
  schedules: Tables<"event_schedules">[];
};

/** Stand de un evento con su avatar resuelto y sus métricas. */
export type EventSpot = Pick<Tables<"event_spots">, "id" | "name" | "type" | "status" | "avatar_path"> & {
  avatarUrl: string;
  count: { scans: number };
};

/** Usuario con metadatos de perfil. */
export type UserMetadata = {
  name: string;
  email: string;
  avatar: string | null;
};

/**
 * Visitante del evento: identidad + medallas conseguidas y último escaneo.
 * La identidad sale de `auth.users` (ver `getEventParticipants`), no de la
 * tabla `profiles`.
 */
export type EventParticipant = UserMetadata & {
  id: string;
  count: { scans: number };
  lastScanAt: string;
};
