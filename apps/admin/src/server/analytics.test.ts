import { describe, expect, it } from "vitest";
import type { EventParticipant, EventScan, EventSpot } from "@/types";
import { buildEventAnalytics } from "./analytics";

const TZ = "America/Argentina/Buenos_Aires";

const spot = (id: string, name: string): EventSpot => ({
  id,
  name,
  type: "LOCAL",
  status: "ACTIVE",
  avatar_path: `${id}.webp`,
  avatarUrl: `https://cdn/${id}.webp`,
  count: { scans: 0 },
});

const participant = (id: string, scans: number): EventParticipant => ({
  id,
  name: `Visitante ${id}`,
  email: `${id}@mail.com`,
  avatar: null,
  count: { scans },
  lastScanAt: "2026-04-05T20:00:00Z",
});

let nextId = 1;
const scan = (userId: string, spotId: string, iso: string): EventScan => ({
  id: nextId++,
  user_id: userId,
  spot_id: spotId,
  collected_at: iso,
});

const spots = [spot("s1", "Charly"), spot("s2", "Lore")];

// 16:00 y 18:00 UTC son 13:00 y 15:00 en Buenos Aires (UTC-3).
const scans = [
  scan("u1", "s1", "2026-04-05T16:10:00Z"),
  scan("u1", "s2", "2026-04-05T18:20:00Z"),
  scan("u2", "s1", "2026-04-05T18:30:00Z"),
];

const participants = [participant("u1", 2), participant("u2", 1)];

describe("buildEventAnalytics", () => {
  it("devuelve series vacías y los stands en cero sin escaneos", () => {
    const result = buildEventAnalytics({
      scans: [],
      spots,
      participants: [],
      timezone: TZ,
    });

    expect(result.timeline).toEqual([]);
    expect(result.perDay).toEqual([]);
    expect(result.perSpot).toEqual([
      { id: "s1", name: "Charly", scans: 0 },
      { id: "s2", name: "Lore", scans: 0 },
    ]);
  });

  it("agrupa por hora local y rellena las horas intermedias vacías", () => {
    const { timeline } = buildEventAnalytics({
      scans,
      spots,
      participants,
      timezone: TZ,
    });

    expect(timeline.map((point) => point.label)).toEqual([
      "13:00",
      "14:00",
      "15:00",
    ]);
    expect(timeline.map((point) => point.scans)).toEqual([1, 0, 2]);
  });

  it("cuenta como visitante nuevo la hora del primer escaneo de cada uno", () => {
    const { timeline } = buildEventAnalytics({
      scans,
      spots,
      participants,
      timezone: TZ,
    });

    // u1 llega 13:00; u2 llega 15:00. El segundo escaneo de u1 no suma.
    expect(timeline.map((point) => point.newVisitors)).toEqual([1, 0, 1]);
  });

  it("acumula escaneos y visitantes por separado", () => {
    const { timeline } = buildEventAnalytics({
      scans,
      spots,
      participants,
      timezone: TZ,
    });

    expect(timeline.map((point) => point.cumulative)).toEqual([1, 1, 3]);
    // u1 entra en la primera hora y u2 en la última: el acumulado de
    // visitantes crece más lento que el de escaneos.
    expect(timeline.map((point) => point.cumulativeVisitors)).toEqual([
      1, 1, 2,
    ]);
  });

  it("ordena los stands por escaneos", () => {
    const { perSpot } = buildEventAnalytics({
      scans,
      spots,
      participants,
      timezone: TZ,
    });

    expect(perSpot).toEqual([
      { id: "s1", name: "Charly", scans: 2 },
      { id: "s2", name: "Lore", scans: 1 },
    ]);
  });

  it("arma distribución y embudo de medallas", () => {
    const { distribution, funnel } = buildEventAnalytics({
      scans,
      spots,
      participants,
      timezone: TZ,
    });

    // u2 tiene 1 medalla, u1 tiene 2.
    expect(distribution).toEqual([
      { medals: 1, visitors: 1 },
      { medals: 2, visitors: 1 },
    ]);
    expect(funnel).toEqual([
      { medals: 1, visitors: 2, percent: 100 },
      { medals: 2, visitors: 1, percent: 50 },
    ]);
  });

  it("cruza stands y horas en el heatmap", () => {
    const { heatmap } = buildEventAnalytics({
      scans,
      spots,
      participants,
      timezone: TZ,
    });

    expect(heatmap.hours).toEqual([13, 14, 15]);
    expect(heatmap.max).toBe(1);
    expect(heatmap.rows).toEqual([
      { id: "s1", name: "Charly", cells: [1, 0, 1], total: 2 },
      { id: "s2", name: "Lore", cells: [0, 0, 1], total: 1 },
    ]);
  });

  it("separa jornadas y no rellena las horas entre días distintos", () => {
    const multiDay = [
      scan("u1", "s1", "2026-04-05T18:00:00Z"),
      scan("u2", "s1", "2026-04-06T16:00:00Z"),
    ];

    const { timeline, perDay } = buildEventAnalytics({
      scans: multiDay,
      spots,
      participants,
      timezone: TZ,
    });

    expect(perDay.map((day) => day.day)).toEqual(["2026-04-05", "2026-04-06"]);
    // Dos jornadas de una hora cada una: no se rellenan las 20 horas del medio.
    expect(timeline).toHaveLength(2);
    expect(timeline[0].label).toContain("15:00");
    expect(timeline[1].label).toContain("13:00");
  });
});
