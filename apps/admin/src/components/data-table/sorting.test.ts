import { describe, expect, it } from "vitest";
import { formatSort, parseSort } from "./sorting";

describe("parseSort", () => {
  it("sin valor no ordena", () => {
    expect(parseSort("")).toEqual([]);
  });

  it("lee ascendente y descendente", () => {
    expect(parseSort("scans")).toEqual([{ id: "scans", desc: false }]);
    expect(parseSort("-scans")).toEqual([{ id: "scans", desc: true }]);
  });

  it("ignora un guion suelto", () => {
    expect(parseSort("-")).toEqual([]);
  });
});

describe("formatSort", () => {
  it("es inverso de parseSort", () => {
    for (const value of ["scans", "-scans", ""]) {
      expect(formatSort(parseSort(value))).toBe(value);
    }
  });

  it("solo serializa la primera columna", () => {
    expect(
      formatSort([
        { id: "name", desc: true },
        { id: "scans", desc: false },
      ]),
    ).toBe("-name");
  });
});
