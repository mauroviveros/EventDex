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
  location: Pick<Tables<"event_locations">, "city"> | null;
  schedules: Pick<Tables<"event_schedules">, "start_datetime" | "end_datetime">[];
  range: { start: string; end: string } | null;
  count: { spots: number; scans: number; participants: number; };
};

/** Usuario con metadatos de perfil. */
export type UserMetadata = {
  name: string;
  email: string;
  avatar: string | null;
};
