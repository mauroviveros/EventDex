import type {
  EventAnalytics,
  EventParticipant,
  EventScan,
  EventSpot,
} from "@/types";
import { eventDay, eventHour, formatDayLabel } from "@/utils";

type BuildInput = {
  scans: EventScan[];
  spots: EventSpot[];
  participants: EventParticipant[];
  timezone: string;
};

const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

/**
 * Series del tab Estadísticas, derivadas de los escaneos ya leídos.
 *
 * Función pura (sin I/O) para poder testear la agregación, que es donde están
 * los casos borde: días sin actividad, horas intermedias vacías y eventos de
 * una sola jornada.
 */
export function buildEventAnalytics({
  scans,
  spots,
  participants,
  timezone,
}: BuildInput): EventAnalytics {
  const empty: EventAnalytics = {
    timeline: [],
    perDay: [],
    perSpot: spots.map((spot) => ({ id: spot.id, name: spot.name, scans: 0 })),
    distribution: [],
    funnel: [],
    heatmap: { hours: [], max: 0, rows: [] },
  };

  if (scans.length === 0) return empty;

  // Cronológico: las filas llegan del más reciente al más viejo.
  const ordered = [...scans].sort((a, b) =>
    a.collected_at.localeCompare(b.collected_at),
  );

  const firstScanByUser = new Map<string, string>();
  for (const scan of ordered) {
    if (!firstScanByUser.has(scan.user_id)) {
      firstScanByUser.set(scan.user_id, scan.collected_at);
    }
  }

  // --- Serie horaria (una entrada por hora con actividad, rellenando los
  // huecos dentro de cada jornada pero no entre jornadas distintas).
  type Bucket = {
    day: string;
    hour: number;
    scans: number;
    newVisitors: number;
  };
  const buckets = new Map<string, Bucket>();
  const key = (day: string, hour: number) => `${day}T${hour}`;

  const touch = (day: string, hour: number) => {
    const id = key(day, hour);
    let bucket = buckets.get(id);
    if (!bucket) {
      bucket = { day, hour, scans: 0, newVisitors: 0 };
      buckets.set(id, bucket);
    }
    return bucket;
  };

  for (const scan of ordered) {
    const day = eventDay(scan.collected_at, timezone);
    const hour = eventHour(scan.collected_at, timezone);
    touch(day, hour).scans += 1;
  }

  for (const first of firstScanByUser.values()) {
    const day = eventDay(first, timezone);
    const hour = eventHour(first, timezone);
    touch(day, hour).newVisitors += 1;
  }

  // Rellena las horas intermedias de cada jornada para que la curva no salte.
  const hoursByDay = new Map<string, number[]>();
  for (const bucket of buckets.values()) {
    const hours = hoursByDay.get(bucket.day) ?? [];
    hours.push(bucket.hour);
    hoursByDay.set(bucket.day, hours);
  }
  for (const [day, hours] of hoursByDay) {
    for (let hour = Math.min(...hours); hour <= Math.max(...hours); hour++) {
      touch(day, hour);
    }
  }

  const days = [...hoursByDay.keys()].sort();
  const isSingleDay = days.length === 1;

  let cumulative = 0;
  let cumulativeVisitors = 0;
  const timeline = [...buckets.values()]
    .sort((a, b) => a.day.localeCompare(b.day) || a.hour - b.hour)
    .map((bucket) => {
      cumulative += bucket.scans;
      cumulativeVisitors += bucket.newVisitors;
      return {
        key: key(bucket.day, bucket.hour),
        label: isSingleDay
          ? hourLabel(bucket.hour)
          : `${formatDayLabel(bucket.day)} ${hourLabel(bucket.hour)}`,
        scans: bucket.scans,
        newVisitors: bucket.newVisitors,
        cumulative,
        cumulativeVisitors,
      };
    });

  // --- Por jornada
  const perDay = days.map((day) => {
    const dayScans = ordered.filter(
      (scan) => eventDay(scan.collected_at, timezone) === day,
    );
    return {
      day,
      label: formatDayLabel(day),
      scans: dayScans.length,
      visitors: new Set(dayScans.map((scan) => scan.user_id)).size,
    };
  });

  // --- Por stand. Contar visitantes únicos acá daría exactamente lo mismo:
  // el índice único (user_id, spot_id) garantiza una fila por par.
  const scansBySpot = new Map<string, number>();
  for (const scan of ordered) {
    scansBySpot.set(scan.spot_id, (scansBySpot.get(scan.spot_id) ?? 0) + 1);
  }

  const perSpot = spots
    .map((spot) => ({
      id: spot.id,
      name: spot.name,
      scans: scansBySpot.get(spot.id) ?? 0,
    }))
    .sort((a, b) => b.scans - a.scans);

  // --- Distribución y embudo de medallas
  const total = participants.length;
  const medalsByVisitor = new Map<string, number>();
  for (const participant of participants) {
    medalsByVisitor.set(participant.id, participant.count.scans);
  }

  const maxMedals = Math.max(spots.length, ...medalsByVisitor.values(), 0);
  const distribution: EventAnalytics["distribution"] = [];
  const funnel: EventAnalytics["funnel"] = [];

  for (let medals = 1; medals <= maxMedals; medals++) {
    const exact = [...medalsByVisitor.values()].filter(
      (count) => count === medals,
    ).length;
    const atLeast = [...medalsByVisitor.values()].filter(
      (count) => count >= medals,
    ).length;

    distribution.push({ medals, visitors: exact });
    funnel.push({
      medals,
      visitors: atLeast,
      percent: total ? Math.round((atLeast * 100) / total) : 0,
    });
  }

  // --- Heatmap stand × hora (agregando todas las jornadas)
  const allHours = [...new Set([...buckets.values()].map((b) => b.hour))].sort(
    (a, b) => a - b,
  );
  const cellsBySpot = new Map<string, Map<number, number>>();
  for (const scan of ordered) {
    const hour = eventHour(scan.collected_at, timezone);
    const cells = cellsBySpot.get(scan.spot_id) ?? new Map<number, number>();
    cells.set(hour, (cells.get(hour) ?? 0) + 1);
    cellsBySpot.set(scan.spot_id, cells);
  }

  const heatmapRows = perSpot.map((spot) => {
    const cells = allHours.map(
      (hour) => cellsBySpot.get(spot.id)?.get(hour) ?? 0,
    );
    return {
      id: spot.id,
      name: spot.name,
      cells,
      total: spot.scans,
    };
  });

  return {
    timeline,
    perDay,
    perSpot,
    distribution,
    funnel,
    heatmap: {
      hours: allHours,
      max: Math.max(0, ...heatmapRows.flatMap((row) => row.cells)),
      rows: heatmapRows,
    },
  };
}
