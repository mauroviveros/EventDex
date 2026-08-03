import type { Enums, Tables } from "@eventdex/database";

// Re-exporta el paquete de tipos compartido. Mantener `@/types` como punto de
// entrada evita tocar los imports de la app si el paquete cambia de estructura.
export * from "@eventdex/database";

/**
 * Membresía del usuario en una organización, o null si no es organizador.
 * `domain` es el host donde está publicada la app del evento: de ahí salen los
 * links que se imprimen en los QR de los stands.
 */
export type Membership = {
  role: Enums<"ORGANIZATION_MEMBER_ROLE">;
  organization: Pick<
    Tables<"organizations">,
    "id" | "name" | "slug" | "domain"
  >;
};

/**
 * Estado que se le muestra al organizador. No es la columna `status`: la
 * combina con las fechas del evento (ver `eventPhase`).
 */
export type EventPhase = "DRAFT" | "LIVE" | "UPCOMING" | "FINISHED";

/** Evento de la organización con sus métricas básicas (spots, escaneos, participantes únicos). */
export type OrganizationEvent = Pick<
  Tables<"events">,
  "id" | "title" | "edition" | "status" | "timezone"
> & {
  location: Pick<
    Tables<"event_locations">,
    "city" | "country" | "address"
  > | null;
  schedules: Pick<
    Tables<"event_schedules">,
    "start_datetime" | "end_datetime"
  >[];
  range: { start: string; end: string } | null;
  count: { spots: number; scans: number; participants: number };
};

/** Evento del listado con su estado ya resuelto en el servidor. */
export type EventListItem = OrganizationEvent & { phase: EventPhase };

/** Evento con su ubicación y horarios, para la vista de detalle. */
export type EventDetail = Tables<"events"> & {
  location: Tables<"event_locations"> | null;
  schedules: Tables<"event_schedules">[];
};

/** Stand de un evento con su avatar resuelto y sus métricas. */
export type EventSpot = Pick<
  Tables<"event_spots">,
  "id" | "name" | "type" | "status" | "avatar_path"
> & {
  avatarUrl: string;
  count: { scans: number };
};

/** Stand completo, para precargar el formulario de edición. */
export type EventSpotDetail = Pick<
  Tables<"event_spots">,
  "id" | "name" | "description" | "location" | "type" | "status" | "avatar_path"
> & { avatarUrl: string };

/** Escaneo crudo: la fila de `user_spot_history` tal como se lee. */
export type EventScan = Pick<
  Tables<"user_spot_history">,
  "id" | "spot_id" | "user_id" | "collected_at"
>;

/**
 * Resumen del evento para el tab Overview. Es una foto: se calcula al
 * renderizar la página y no se actualiza solo.
 */
export type EventOverview = {
  totals: {
    visitors: number;
    scans: number;
    spots: number;
    activeSpots: number;
    /** Visitantes que juntaron todas las medallas. */
    completed: number;
  };
  /**
   * Barras de progreso: el porcentaje para la barra y los números crudos que
   * lo respaldan (un 3% no dice si es 3 de 100 o 30 de 1000).
   */
  progress: Record<
    "completed" | "coverage" | "averageMedals",
    { percent: number; value: number; total: number }
  >;
  /** Día (ISO) que grafica la actividad: el de más escaneos. */
  day: string | null;
  activity: { hour: number; label: string; scans: number }[];
  peak: { hour: number; label: string; scans: number } | null;
  topSpots: { id: string; name: string; scans: number }[];
  topParticipants: {
    id: string;
    name: string;
    avatar: string | null;
    scans: number;
  }[];
  recent: { id: number; user: string; spot: string; collectedAt: string }[];
};

/**
 * Series del tab Estadísticas. Todo se deriva de los mismos escaneos que usa
 * el resumen; también es una foto del momento de la carga.
 */
export type EventAnalytics = {
  /** Serie horaria cronológica, con acumulados y llegadas por hora. */
  timeline: {
    key: string;
    label: string;
    scans: number;
    /** Visitantes cuyo primer escaneo cayó en esta hora: llegadas. */
    newVisitors: number;
    cumulative: number;
    cumulativeVisitors: number;
  }[];
  /** Escaneos y visitantes por jornada (solo útil si el evento dura varios días). */
  perDay: { day: string; label: string; scans: number; visitors: number }[];
  /**
   * Ranking completo de stands. No lleva "visitantes únicos" porque sería la
   * misma cifra: el índice único (user_id, spot_id) impide que alguien escanee
   * dos veces el mismo stand.
   */
  perSpot: { id: string; name: string; scans: number }[];
  /** Cuántos visitantes juntaron exactamente N medallas. */
  distribution: { medals: number; visitors: number }[];
  /** Cuántos visitantes llegaron al menos a N medallas. */
  funnel: { medals: number; visitors: number; percent: number }[];
  /** Escaneos por stand y hora; `hours` son las columnas del heatmap. */
  heatmap: {
    hours: number[];
    max: number;
    rows: { id: string; name: string; cells: number[]; total: number }[];
  };
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
