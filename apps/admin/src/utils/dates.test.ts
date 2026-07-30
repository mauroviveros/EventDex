import { describe, expect, it } from "vitest";
import { formatDateRange } from "./dates";

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
