import { describe, expect, it } from "vitest";
import { formatDateRange, formatRelativeTime, scheduleRange } from "./dates";

describe("formatRelativeTime", () => {
  const now = new Date("2026-04-05T18:00:00Z").getTime();
  const ago = (ms: number) => new Date(now - ms).toISOString();

  it("resuelve los tramos de menos de un minuto", () => {
    expect(formatRelativeTime(ago(20_000), now)).toBe("recién");
  });

  it("escala de minutos a horas y días", () => {
    expect(formatRelativeTime(ago(2 * 60_000), now)).toBe("hace 2 min");
    expect(formatRelativeTime(ago(3 * 3_600_000), now)).toBe("hace 3 h");
    expect(formatRelativeTime(ago(2 * 86_400_000), now)).toBe("hace 2 d");
  });
});

describe("scheduleRange", () => {
  it("devuelve null sin horarios", () => {
    expect(scheduleRange([])).toBeNull();
  });

  it("toma el primer inicio y el último fin, sin importar el orden", () => {
    expect(
      scheduleRange([
        {
          start_datetime: "2026-04-06T14:00:00Z",
          end_datetime: "2026-04-06T21:00:00Z",
        },
        {
          start_datetime: "2026-04-05T16:00:00Z",
          end_datetime: "2026-04-05T23:00:00Z",
        },
      ]),
    ).toEqual({
      start: "2026-04-05T16:00:00Z",
      end: "2026-04-06T21:00:00Z",
    });
  });
});

describe("formatDateRange", () => {
  it("colapsa el mes y el año cuando el rango cae en el mismo mes", () => {
    expect(
      formatDateRange("2026-03-15T09:00:00Z", "2026-03-17T21:00:00Z"),
    ).toBe("15–17 mar 2026");
  });

  it("repite el mes cuando el rango lo cruza", () => {
    expect(
      formatDateRange("2026-03-28T09:00:00Z", "2026-04-02T21:00:00Z"),
    ).toBe("28 mar – 2 abr 2026");
  });

  it("repite el año cuando el rango lo cruza", () => {
    expect(
      formatDateRange("2026-12-30T09:00:00Z", "2027-01-02T21:00:00Z"),
    ).toBe("30 dic 2026 – 2 ene 2027");
  });

  it("muestra una sola fecha cuando el evento dura un día", () => {
    expect(
      formatDateRange("2026-03-15T09:00:00Z", "2026-03-15T21:00:00Z"),
    ).toBe("15 mar 2026");
  });
});
