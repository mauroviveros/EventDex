import { describe, expect, it } from "vitest";
import { resolveSafeNextPath, spotPublicUrl } from "./routes";

describe("resolveSafeNextPath", () => {
  it("cae a la raíz cuando no hay valor", () => {
    expect(resolveSafeNextPath(null)).toBe("/");
    expect(resolveSafeNextPath("")).toBe("/");
  });

  it("conserva rutas internas válidas", () => {
    expect(resolveSafeNextPath("/events")).toBe("/events");
    expect(resolveSafeNextPath("/events/123?tab=spots")).toBe(
      "/events/123?tab=spots",
    );
  });

  it("rechaza URLs absolutas (open redirect)", () => {
    expect(resolveSafeNextPath("https://evil.com")).toBe("/");
    expect(resolveSafeNextPath("http://evil.com")).toBe("/");
  });

  it("rechaza rutas protocol-relative (//host)", () => {
    expect(resolveSafeNextPath("//evil.com")).toBe("/");
  });
});

describe("spotPublicUrl", () => {
  const spotId = "9f1c2f2e-0000-4000-8000-000000000001";

  it("arma la URL con el host de la organización", () => {
    expect(spotPublicUrl("evento.lodecharlytcg.com", spotId)).toBe(
      `https://evento.lodecharlytcg.com/spot/${spotId}`,
    );
  });

  it("tolera esquema, barra final y espacios", () => {
    const expected = `https://evento.lodecharlytcg.com/spot/${spotId}`;

    expect(spotPublicUrl("https://evento.lodecharlytcg.com", spotId)).toBe(
      expected,
    );
    expect(spotPublicUrl("http://evento.lodecharlytcg.com/", spotId)).toBe(
      expected,
    );
    expect(spotPublicUrl("  evento.lodecharlytcg.com//  ", spotId)).toBe(
      expected,
    );
  });

  it("devuelve null si la organización no tiene dominio", () => {
    expect(spotPublicUrl(null, spotId)).toBeNull();
    expect(spotPublicUrl(undefined, spotId)).toBeNull();
    expect(spotPublicUrl("   ", spotId)).toBeNull();
    expect(spotPublicUrl("https://", spotId)).toBeNull();
  });
});
