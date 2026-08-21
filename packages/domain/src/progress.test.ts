import { describe, expect, it } from "vitest";
import { collectionProgress, raffleEligibility } from "./progress";

const SPOTS = ["a", "b", "c", "d", "e"];

describe("collectionProgress", () => {
  it("cuenta las medallas de los spots activos", () => {
    expect(collectionProgress(["a", "b", "c"], SPOTS)).toMatchObject({
      claimed: 3,
      total: 5,
      remaining: 2,
      percent: 60,
      isComplete: false,
    });
  });

  it("un evento sin spots activos no divide por cero", () => {
    expect(collectionProgress([], []).percent).toBe(0);
  });

  it("no felicita en un evento vacío", () => {
    // claimed >= total seria 0 >= 0 -> true sin el guard `total > 0`;
    expect(collectionProgress([], []).isComplete).toBe(false);
  });

  it("un spot desactivado después de reclamarlo no infla el porcentaje", () => {
    // Reclamo los 5, el organizador bajo "e" a mitad del evento.
    const p = collectionProgress(SPOTS, SPOTS.slice(0, 4));
    expect(p).toMatchObject({
      claimed: 4,
      total: 4,
      remaining: 0,
      percent: 100,
      isComplete: true,
    });
  });

  it("completa cuando junto todos los activos", () => {
    expect(collectionProgress(SPOTS, SPOTS).isComplete).toBe(true);
  });
});

describe("raffleEligibility", () => {
  it("entra al llegar al mínimo", () => {
    expect(raffleEligibility(3, 3)).toMatchObject({
      isEligible: true,
      missing: 0,
    });
  });

  it("dice cuántas faltan", () => {
    expect(raffleEligibility(1, 3)).toMatchObject({
      isEligible: false,
      missing: 2,
    });
  });

  it("el staff no participa por más medallas que junte", () => {
    const e = raffleEligibility(99, 3, true);
    expect(e.isEligible).toBe(false);
    // Y no le decimos que le faltan: no le faltan, esta excluido.
    expect(e.missing).toBe(0);
  });

  it("min_claims 0 deja entrar a cualquier registrado", () => {
    expect(raffleEligibility(0, 0).isEligible).toBe(true);
  });

  it("el reclamo de un spot dado de baja sigue contando para el sorteo", () => {
    // El caso que separa las dos funciones: junto 3, bajaron uno.
    // La coleccion muestra 2 de 2; el sorteo sigue viendo 3.
    const progreso = collectionProgress(["a", "b", "c"], ["a", "b"]);
    expect(progreso.claimed).toBe(2);
    expect(raffleEligibility(3, 3).isEligible).toBe(true);
  });
});
