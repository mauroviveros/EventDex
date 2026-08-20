import { describe, expect, it } from "vitest";
import { eventPhase, eventRange } from "./event-phase";

// Expo de sábado y domingo, 14:00 a 22:00 hora argentina (GMT-3).
const SABADO = { starts_at: "2026-09-19T17:00:00+00:00", ends_at: "2026-09-20T01:00:00+00:00" };
const DOMINGO = { starts_at: "2026-09-20T17:00:00+00:00", ends_at: "2026-09-21T01:00:00+00:00" };
const JORNADAS = [SABADO, DOMINGO];

const t = (iso: string) => Date.parse(iso);

describe("eventRange", () => {
  it("va del inicio de la primera al fin de la última", () => {
    expect(eventRange(JORNADAS)).toEqual({
      start: t(SABADO.starts_at),
      end: t(DOMINGO.ends_at),
    });
  });

  it("no depende del orden en que vengan las jornadas", () => {
    // PostgREST no garantiza el orden de un recurso embebido.
    expect(eventRange([DOMINGO, SABADO])).toEqual(eventRange(JORNADAS));
  });

  it("es null sin jornadas", () => {
    expect(eventRange([])).toBeNull();
  });

  it("es null si alguna fecha es inválida", () => {
    expect(eventRange([{ starts_at: "no soy una fecha", ends_at: SABADO.ends_at }])).toBeNull();
  });
});

describe("eventPhase", () => {
  it("sigue en curso el sábado a la medianoche, en el hueco entre jornadas", () => {
    // El bug que evita mirar jornada por jornada: a esta hora el sábado ya
    // terminó y el domingo no empezó, pero el evento NO terminó.
    expect(eventPhase(JORNADAS, t("2026-09-20T03:00:00+00:00"))).toBe("live");
  });

  it("es upcoming antes de arrancar", () => {
    expect(eventPhase(JORNADAS, t("2026-09-19T16:59:59+00:00"))).toBe("upcoming");
  });

  it("es finished después del cierre de la última jornada", () => {
    expect(eventPhase(JORNADAS, t("2026-09-21T01:00:01+00:00"))).toBe("finished");
  });

  it("los bordes son inclusivos, igual que en event_timeline", () => {
    expect(eventPhase(JORNADAS, t("2026-09-19T17:00:00+00:00"))).toBe("live");
    expect(eventPhase(JORNADAS, t("2026-09-21T01:00:00+00:00"))).toBe("live");
  });

  it("una fecha inválida NO abre la ventana de reclamo", () => {
    expect(
      eventPhase([{ starts_at: "x", ends_at: "y" }], t("2026-09-20T00:00:00+00:00"))
    ).toBeNull();
  });

  it("es null sin jornadas", () => {
    expect(eventPhase([])).toBeNull();
  });
});
