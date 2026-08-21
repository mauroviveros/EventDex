import { describe, expect, it } from "vitest";
import { timeUntil } from "./countdown";

const AHORA = Date.parse("2026-04-01T00:00:00+00:00");

describe("countdown", () => {
  it("descompone el tiempo restante", () => {
    const target = Date.parse("2026-04-03T05:30:15+00:00"); // 2d 5h 30m 15s después de AHORA
    expect(timeUntil(target, AHORA)).toMatchObject({
      days: 2,
      hours: 5,
      minutes: 30,
      seconds: 15,
      isDone: false,
    });
  });

  it("no cuenta hacia atras cuando el objetivo ya paso", () => {
    const pasado = Date.parse("2026-03-31T00:00:00+00:00"); // un día antes de AHORA
    expect(timeUntil(pasado, AHORA)).toMatchObject({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isDone: true,
    });
  });

  it("isDone justo en el instante objetivo", () => {
    expect(timeUntil(AHORA, AHORA).isDone).toBe(true);
  });
});
