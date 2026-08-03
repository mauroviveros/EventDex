import { createServiceClient } from "@/libs/supabase/service";
import type { EventParticipant, UserMetadata } from "@/types";

const USERS_PAGE_SIZE = 1000;

const ANONYMOUS: UserMetadata = {
  name: "Visitante",
  email: "",
  avatar: null,
};

/**
 * Identidades (nombre, mail, avatar) de los usuarios pedidos.
 *
 * Salen de `auth.users`, no de la tabla `profiles`: esa tabla no se completa
 * en ningún flujo (hoy tiene una sola fila) mientras que el metadata de auth
 * lo escribe el login de Google. Es el mismo criterio que usa el sorteo en
 * `apps/event/src/server/raffle.ts`.
 *
 * La API admin no permite traer usuarios por lista de ids, así que se pagina
 * el listado completo y se arma un índice; se corta apenas se encontraron
 * todos los pedidos.
 */
async function getUserIdentities(
  ids: Set<string>,
): Promise<Map<string, UserMetadata>> {
  const service = createServiceClient();
  const identities = new Map<string, UserMetadata>();

  for (let page = 1; identities.size < ids.size; page++) {
    const { data, error } = await service.auth.admin.listUsers({
      page,
      perPage: USERS_PAGE_SIZE,
    });

    if (error) throw error;
    const users = data?.users ?? [];
    if (users.length === 0) break;

    for (const user of users) {
      if (!ids.has(user.id)) continue;

      const metadata = user.user_metadata as {
        full_name?: string;
        avatar_url?: string;
      };

      identities.set(user.id, {
        name: metadata?.full_name ?? user.email ?? ANONYMOUS.name,
        email: user.email ?? "",
        avatar: metadata?.avatar_url ?? null,
      });
    }

    if (users.length < USERS_PAGE_SIZE) break;
  }

  return identities;
}

/**
 * Visitantes del evento: todo usuario que escaneó al menos un stand, con
 * cuántas medallas juntó y cuándo fue su último escaneo.
 *
 * Ordena por medallas desc y, a igual cantidad, primero el que las completó
 * antes (mismo criterio de mérito que el sorteo).
 *
 * El caller ya validó que el evento pertenece a la organización con
 * `getOrganizationEvent`; acá el service client solo filtra por sus spots.
 */
export async function getEventParticipants(
  eventId: string,
): Promise<EventParticipant[]> {
  const service = createServiceClient();

  // Los stands dados de baja no cuentan, igual que en `getEventSpots`: si no
  // aparecen en la tabla de stands, sus escaneos tampoco deben inflar las
  // medallas de los visitantes.
  const { data: spots, error: spotsError } = await service
    .from("event_spots")
    .select("id")
    .eq("event_id", eventId)
    .is("deleted_at", null);

  if (spotsError) throw spotsError;
  if (!spots || spots.length === 0) return [];

  const { data: scans, error: scansError } = await service
    .from("user_spot_history")
    .select("user_id, collected_at")
    .in(
      "spot_id",
      spots.map((spot) => spot.id),
    );

  if (scansError) throw scansError;
  if (!scans || scans.length === 0) return [];

  // Un escaneo por (usuario, spot) está garantizado por el índice único, así
  // que contar filas equivale a contar medallas.
  const stats = new Map<string, { scans: number; lastScanAt: string }>();
  for (const scan of scans) {
    const current = stats.get(scan.user_id);
    if (!current) {
      stats.set(scan.user_id, { scans: 1, lastScanAt: scan.collected_at });
      continue;
    }
    current.scans += 1;
    if (scan.collected_at > current.lastScanAt) {
      current.lastScanAt = scan.collected_at;
    }
  }

  const identities = await getUserIdentities(new Set(stats.keys()));

  // Se recorre `stats` y no las identidades: un usuario borrado de auth sigue
  // teniendo escaneos y tiene que aparecer igual (como "Visitante").
  return [...stats.entries()]
    .map(([id, stat]) => ({
      id,
      ...(identities.get(id) ?? ANONYMOUS),
      count: { scans: stat.scans },
      lastScanAt: stat.lastScanAt,
    }))
    .sort(
      (a, b) =>
        b.count.scans - a.count.scans ||
        a.lastScanAt.localeCompare(b.lastScanAt),
    );
}
