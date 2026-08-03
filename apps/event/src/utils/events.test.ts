import { describe, expect, it } from "vitest";
import { eventRange, pickActiveEvent } from "./events";

const NOW = Date.parse("2027-09-12T15:00:00Z");
const at = (iso: string) => Date.parse(iso);

/** Evento con una sola jornada, identificado por su id. */
const event = (id: string, start: string, end: string) => ({
  id,
  schedules: [{ start_datetime: start, end_datetime: end }],
});

describe("eventRange", () => {
  it("cubre de la primera jornada a la última", () => {
    const multiDay = {
      schedules: [
        {
          start_datetime: "2027-09-13T10:00:00Z",
          end_datetime: "2027-09-13T20:00:00Z",
        },
        {
          start_datetime: "2027-09-12T10:00:00Z",
          end_datetime: "2027-09-12T20:00:00Z",
        },
      ],
    };

    expect(eventRange(multiDay)).toEqual({
      start: at("2027-09-12T10:00:00Z"),
      end: at("2027-09-13T20:00:00Z"),
    });
  });

  it("interpreta como UTC las fechas sin zona (como las guarda la DB)", () => {
    const range = eventRange({
      schedules: [
        {
          start_datetime: "2027-09-12T10:00:00",
          end_datetime: "2027-09-12T20:00:00",
        },
      ],
    });

    expect(range).toEqual({
      start: at("2027-09-12T10:00:00Z"),
      end: at("2027-09-12T20:00:00Z"),
    });
  });

  it("es null sin jornadas", () => {
    expect(eventRange({ schedules: [] })).toBeNull();
  });
});

describe("pickActiveEvent", () => {
  const live = event("live", "2027-09-12T10:00:00Z", "2027-09-12T20:00:00Z");
  const soon = event("soon", "2027-09-20T10:00:00Z", "2027-09-20T20:00:00Z");
  const later = event("later", "2027-10-01T10:00:00Z", "2027-10-01T20:00:00Z");
  const old = event("old", "2027-08-01T10:00:00Z", "2027-08-01T20:00:00Z");
  const recent = event(
    "recent",
    "2027-09-01T10:00:00Z",
    "2027-09-01T20:00:00Z",
  );

  it("prioriza el que está en curso sobre cualquier otro", () => {
    expect(pickActiveEvent([old, soon, live, recent], NOW)?.id).toBe("live");
  });

  it("sin uno en curso, elige el próximo más cercano", () => {
    expect(pickActiveEvent([later, old, soon, recent], NOW)?.id).toBe("soon");
  });

  it("si todos terminaron, elige el último que terminó", () => {
    expect(pickActiveEvent([old, recent], NOW)?.id).toBe("recent");
  });

  it("incluye los bordes del rango como en curso", () => {
    const range = event(
      "borde",
      "2027-09-12T10:00:00Z",
      "2027-09-12T20:00:00Z",
    );

    expect(pickActiveEvent([range], at("2027-09-12T10:00:00Z"))?.id).toBe(
      "borde",
    );
    expect(pickActiveEvent([range], at("2027-09-12T20:00:00Z"))?.id).toBe(
      "borde",
    );
  });

  it("considera el rango completo: un multijornada sigue en curso entre días", () => {
    const weekend = {
      id: "finde",
      schedules: [
        {
          start_datetime: "2027-09-11T10:00:00Z",
          end_datetime: "2027-09-11T20:00:00Z",
        },
        {
          start_datetime: "2027-09-13T10:00:00Z",
          end_datetime: "2027-09-13T20:00:00Z",
        },
      ],
    };

    // NOW cae el 12, entre las dos jornadas: sigue siendo el evento en curso.
    expect(pickActiveEvent([weekend, soon], NOW)?.id).toBe("finde");
  });

  it("descarta los que no tienen jornadas cargadas", () => {
    const draft = { id: "sin-fechas", schedules: [] };

    expect(pickActiveEvent([draft, recent], NOW)?.id).toBe("recent");
    expect(pickActiveEvent([draft], NOW)).toBeNull();
  });

  it("es null sin eventos", () => {
    expect(pickActiveEvent([], NOW)).toBeNull();
  });
});
