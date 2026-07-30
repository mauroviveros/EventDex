import type {
  EventOverview,
  EventParticipant,
  EventScan,
  EventSpot,
} from "@/types";
import { eventDay, eventHour } from "@/utils";

const RECENT_LIMIT = 8;
const TOP_LIMIT = 5;

/**
 * Resumen del evento derivado de los escaneos ya leídos y de los stands y
 * visitantes que la página cargó.
 *
 * Es una foto del momento de la carga: nada se actualiza solo. Al ser un
 * server component, cada visita a la página recalcula todo.
 */
export function buildEventOverview({
  scans,
  spots,
  participants,
  timezone,
}: {
  scans: EventScan[];
  spots: EventSpot[];
  participants: EventParticipant[];
  timezone: string;
}): EventOverview {
  const spotNames = new Map(spots.map((spot) => [spot.id, spot.name]));
  const participantNames = new Map(
    participants.map((participant) => [participant.id, participant.name]),
  );

  const allScans = scans;
  const activeSpots = spots.filter((spot) => spot.status === "ACTIVE").length;
  const spotsWithScans = spots.filter((spot) => spot.count.scans > 0).length;
  const completed = spots.length
    ? participants.filter(
        (participant) => participant.count.scans >= spots.length,
      ).length
    : 0;

  // El gráfico muestra el día más movido del evento: la mayoría dura una sola
  // jornada, y cuando hay varias esa es la representativa.
  const perDay = new Map<string, number>();
  for (const scan of allScans) {
    const day = eventDay(scan.collected_at, timezone);
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }
  const busiestDay =
    [...perDay.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const perHour = new Map<number, number>();
  if (busiestDay) {
    for (const scan of allScans) {
      if (eventDay(scan.collected_at, timezone) !== busiestDay) continue;
      const hour = eventHour(scan.collected_at, timezone);
      perHour.set(hour, (perHour.get(hour) ?? 0) + 1);
    }
  }

  const hours = [...perHour.keys()];
  const activity = hours.length
    ? Array.from(
        { length: Math.max(...hours) - Math.min(...hours) + 1 },
        (_, index) => {
          const hour = Math.min(...hours) + index;
          return {
            hour,
            label: `${String(hour).padStart(2, "0")}:00`,
            scans: perHour.get(hour) ?? 0,
          };
        },
      )
    : [];

  const peak = activity.reduce<EventOverview["peak"]>(
    (best, point) => (!best || point.scans > best.scans ? point : best),
    null,
  );

  return {
    totals: {
      visitors: participants.length,
      scans: allScans.length,
      spots: spots.length,
      activeSpots,
      completed,
    },
    progress: {
      completed: {
        percent: participants.length
          ? Math.round((completed * 100) / participants.length)
          : 0,
        value: completed,
        total: participants.length,
      },
      coverage: {
        percent: spots.length
          ? Math.round((spotsWithScans * 100) / spots.length)
          : 0,
        value: spotsWithScans,
        total: spots.length,
      },
      averageMedals: {
        percent:
          participants.length && spots.length
            ? Math.round(
                (allScans.length * 100) / (participants.length * spots.length),
              )
            : 0,
        // Decimal a propósito: "1.4 de 7 medallas" describe mejor el promedio
        // que redondearlo a 1.
        value: participants.length
          ? Number((allScans.length / participants.length).toFixed(1))
          : 0,
        total: spots.length,
      },
    },
    day: busiestDay,
    activity,
    peak,
    topSpots: spots.slice(0, TOP_LIMIT).map((spot) => ({
      id: spot.id,
      name: spot.name,
      scans: spot.count.scans,
    })),
    topParticipants: participants.slice(0, TOP_LIMIT).map((participant) => ({
      id: participant.id,
      name: participant.name,
      avatar: participant.avatar,
      scans: participant.count.scans,
    })),
    recent: allScans.slice(0, RECENT_LIMIT).map((scan) => ({
      id: scan.id,
      user: participantNames.get(scan.user_id) ?? "Visitante",
      spot: spotNames.get(scan.spot_id) ?? "—",
      collectedAt: scan.collected_at,
    })),
  };
}
