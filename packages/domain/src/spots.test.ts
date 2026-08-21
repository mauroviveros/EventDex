import { describe, expect, it } from "vitest";
import { resolveSpot } from "./spots";

const CATALOGO = {
  name: "Café Ubbe",
  description: "El café de siempre",
  avatar_path: "spots/cafe.png",
  type: "stand" as const,
};

const SIN_NADA = {
  name_override: null,
  description_override: null,
  avatar_path_override: null,
  snapshot: null,
};

describe("resolveSpot", () => {
  it("sin override ni snapshot usa el catálogo: referencia viva", () => {
    // Evento en borrador: editás el catálogo y se refleja.
    expect(resolveSpot(SIN_NADA, CATALOGO).name).toBe("Café Ubbe");
  });

  it("el snapshot le gana al catálogo: no se reescribe la historia", () => {
    // La Expo 2026 se publicó cuando el stand se llamaba "Café Ubbe".
    // En 2027 lo renombraron en el catálogo. El histórico NO cambia.

    const publicado = { ...SIN_NADA, snapshot: { name: "Café Ubbe", type: "stand" } };
    const catalogoRenombrado = { ...CATALOGO, name: "Ubbe Coffee" };

    expect(resolveSpot(publicado, catalogoRenombrado).name).toBe("Café Ubbe");
  });

  it("el override le gana a todo", () => {
    const conOverride = {
      ...SIN_NADA,
      name_override: "Café Ubbe · Edición Aniversario",
      snapshot: { name: "Café Ubbe" },
    };
    expect(resolveSpot(conOverride, CATALOGO).name).toBe("Café Ubbe · Edición Aniversario");
  });

  it("un override en blanco NO pisa el catálogo", () => {
    // El bug del `??`: "" es distinto de null, así que sin `present()` esto
    // devolvería "" y el spot se renderizaría sin nombre.
    const vacio = { ...SIN_NADA, name_override: "   " };
    expect(resolveSpot(vacio, CATALOGO).name).toBe("Café Ubbe");
  });

  it("cae al catálogo si el snapshot no trae ese campo", () => {
    // publish_event() congela cuatro campos, pero un snapshot viejo o parcial
    // no debe dejar el spot sin descripción.
    const parcial = { ...SIN_NADA, snapshot: { name: "Café Ubbe" } };
    expect(resolveSpot(parcial, CATALOGO).description).toBe("El café de siempre");
  });

  it("ignora un snapshot que no sea un objeto", () => {
    // `snapshot` es jsonb: puede llegar como string, número o array. Son las
    // dos ramas de `parseSnapshot`, y las dos tienen que caer al catálogo.
    expect(resolveSpot({ ...SIN_NADA, snapshot: "roto" }, CATALOGO).name).toBe("Café Ubbe");
    expect(resolveSpot({ ...SIN_NADA, snapshot: [] }, CATALOGO).name).toBe("Café Ubbe");
  });

  it("`type` sale del snapshot cuando está congelado", () => {
    const publicado = { ...SIN_NADA, snapshot: { type: "attraction" } };
    expect(resolveSpot(publicado, CATALOGO).type).toBe("attraction");
  });
});
