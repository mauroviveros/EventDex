import { describe, expect, it } from "vitest";
import { countBy } from ".";

describe("countBy", () => {
  it("agrupa y cuenta por clave", () => {
    const rows = [{ id: "a" }, { id: "b" }, { id: "a" }];
    const counts = countBy(rows, (row) => row.id);
    expect(counts.get("a")).toBe(2);
    expect(counts.get("b")).toBe(1);
    expect(counts.get("c")).toBeUndefined();
  });
});
