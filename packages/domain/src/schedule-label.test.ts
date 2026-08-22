import { describe, expect, it } from "vitest";
import { formatScheduleLabel, toZonedIso } from "./schedule-label";

const BA = "America/Argentina/Buenos_Aires";

// Domingo 5 de abril de 2026, 20:00 a 01:00 hora argentina.
const JORNADA = {
  starts_at: "2026-04-05T23:00:00+00:00",
  ends_at: "2026-04-06T04:00:00+00:00",
};

describe("formatScheduleLabel", () => {
  it("formatea en la zona del evento", () => {
    expect(formatScheduleLabel(JORNADA, BA)).toBe("Domingo 5 de abril · 20:00 a 01:00 (GMT-3)");
  });

  it("el mismo instante en otra zona da otra hora local", () => {
    // Es lo que verían si formateáramos en la zona del visitante: por eso NO
    // lo hacemos. El asistente tiene que leer la hora del predio.
    const madrid = formatScheduleLabel(JORNADA, "Europe/Madrid");
    expect(madrid).toContain("01:00 a 06:00");
    expect(madrid).toContain("GMT+2");
  });

  it("respeta el horario de verano del instante, no el de hoy", () => {
    // Madrid en enero es GMT+1; en abril, GMT+2. Una implementación que use el
    // offset actual en vez del del instante devuelve el mismo para los dos.
    const enero = { starts_at: "2026-01-15T12:00:00+00:00", ends_at: "2026-01-15T14:00:00+00:00" };
    expect(formatScheduleLabel(enero, "Europe/Madrid")).toContain("GMT+1");
    expect(formatScheduleLabel(JORNADA, "Europe/Madrid")).toContain("GMT+2");
  });

  it("es null con una fecha inválida en vez de romper el render", () => {
    expect(formatScheduleLabel({ starts_at: "x", ends_at: "y" }, BA)).toBeNull();
  });
});

describe("toZonedIso", () => {
  it("usa el offset de la zona del evento", () => {
    const instante = Date.parse("2026-09-20T00:00:00+00:00");

    expect(toZonedIso(instante, "America/Argentina/Buenos_Aires")).toBe(
      "2026-09-19T21:00:00-03:00"
    );
  });

  it("el mismo instante en otra zona da otra fecha local", () => {
    // Es el caso que justifica la función: medianoche UTC ya es el día 20 en
    // Madrid y todavía el 19 en Buenos Aires.
    const instante = Date.parse("2026-09-20T00:00:00+00:00");

    expect(toZonedIso(instante, "Europe/Madrid")).toBe("2026-09-20T02:00:00+02:00");
  });

  it("en UTC devuelve Z", () => {
    expect(toZonedIso(Date.parse("2026-09-20T00:00:00Z"), "UTC")).toBe("2026-09-20T00:00:00Z");
  });
});
