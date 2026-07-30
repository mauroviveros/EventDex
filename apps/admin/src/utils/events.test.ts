import { describe, expect, it } from "vitest";
import { eventPhase } from "./events";

const now = new Date("2026-04-05T18:00:00Z").getTime();

// Jornada del 5 de abril, 16:00–21:00 UTC (13:00–18:00 en Buenos Aires).
const schedule = {
  start_datetime: "2026-04-05T16:00:00Z",
  end_datetime: "2026-04-05T21:00:00Z",
};

describe("eventPhase", () => {
  it("es borrador si el evento no está publicado, aunque tenga fechas", () => {
    expect(eventPhase({ status: "INACTIVE", schedules: [schedule] }, now)).toBe(
      "DRAFT",
    );
    expect(eventPhase({ status: null, schedules: [schedule] }, now)).toBe(
      "DRAFT",
    );
  });

  it("es borrador si está publicado pero todavía no tiene horarios", () => {
    expect(eventPhase({ status: "ACTIVE", schedules: [] }, now)).toBe("DRAFT");
  });

  it("está en vivo cuando el ahora cae dentro del rango", () => {
    expect(eventPhase({ status: "ACTIVE", schedules: [schedule] }, now)).toBe(
      "LIVE",
    );
  });

  it("es próximo antes de empezar y finalizado después de terminar", () => {
    const antes = new Date("2026-04-05T15:59:00Z").getTime();
    const despues = new Date("2026-04-05T21:01:00Z").getTime();

    expect(eventPhase({ status: "ACTIVE", schedules: [schedule] }, antes)).toBe(
      "UPCOMING",
    );
    expect(
      eventPhase({ status: "ACTIVE", schedules: [schedule] }, despues),
    ).toBe("FINISHED");
  });

  it("sigue en vivo entre jornadas de un evento de varios días", () => {
    const multiDay = [
      schedule,
      {
        start_datetime: "2026-04-07T16:00:00Z",
        end_datetime: "2026-04-07T21:00:00Z",
      },
    ];

    // El 6 a la tarde no hay jornada abierta, pero el evento está en curso:
    // marcarlo "finalizado" sería engañoso.
    const entreJornadas = new Date("2026-04-06T18:00:00Z").getTime();
    expect(
      eventPhase({ status: "ACTIVE", schedules: multiDay }, entreJornadas),
    ).toBe("LIVE");
  });
});
