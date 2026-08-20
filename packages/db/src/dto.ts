import type { Tables } from "./database.types";

/** Marca de la organización. En la base es `jsonb`; acá tiene forma. */
export interface OrganizationBrand {
  primary?: string;
  radius?: string;
}

/** Configuración por evento. En la base es `jsonb`. */
export interface EventSettings {
  raffleEnabled?: boolean;
  medalGoal?: number;
}

/** Evento con sus jornadas, que es como lo consume siempre la app pública. */
export interface EventWithSchedules extends Tables<"events"> {
  schedules: Tables<"event_schedules">[];
  venue: Tables<"venues"> | null;
}

/** Spot del evento con overrides y snapshot YA resueltos (vista SQL). */
export type EventSpotResolved = Tables<"event_spots_resolved">;

/** Participante del sorteo. */
export interface RaffleParticipant {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  claimsCount: number;
}
