import { describe, expect, it } from "vitest";
import { eventJsonLd } from "./seo";

const EVENTO = {
  title: "Expo Ubbe",
  edition_label: "2026",
  summary: "La segunda edición",
  timezone: "America/Argentina/Buenos_Aires",
  venue: {
    name: "Predio Ferial",
    address_line: "Av. Siempreviva 742",
    city: "Buenos Aires",
    state: "CABA",
    postal_code: null,
    country: "AR",
  },
};

const RANGE = {
  start: Date.parse("2026-09-19T17:00:00+00:00"),
  end: Date.parse("2026-09-21T01:00:00+00:00"),
};

const url = new URL("https://expoubbe.com/");

describe("eventJsonLd", () => {
  it("emite los tres campos que Google exige", () => {
    // Sin `name`, `startDate` y `location`, el rich result no aparece.
    const ld = eventJsonLd({ event: EVENTO, range: RANGE, url, organizationName: "TRY Ubbe" });

    expect(ld.name).toBe("Expo Ubbe 2026");
    expect(ld.startDate).toBeDefined();
    expect(ld.location).toBeDefined();
  });

  it("las fechas llevan el offset del evento, no UTC", () => {
    // Google usa `startDate` para mostrar el DÍA. En UTC, un evento que arranca
    // 21:00 GMT-3 cae en la fecha siguiente y aparece corrido un día.
    const ld = eventJsonLd({ event: EVENTO, range: RANGE, url, organizationName: "TRY Ubbe" });

    expect(ld.startDate).toBe("2026-09-19T14:00:00-03:00");
  });

  it("omite las claves sin dato en vez de mandarlas en null", () => {
    const sinVenue = { ...EVENTO, venue: null, summary: null };
    const ld = eventJsonLd({ event: sinVenue, range: RANGE, url, organizationName: "TRY Ubbe" });

    // Para Google, un campo ausente es mejor que uno vacío.
    expect(ld).not.toHaveProperty("location");
    expect(ld).not.toHaveProperty("description");
  });
});
