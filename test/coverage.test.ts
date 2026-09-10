import { describe, expect, it } from "vitest";
import { coverage } from "../src/coverage.js";
import { loadKg } from "../src/load.js";

const kg = loadKg(new URL("./fixtures/kg", import.meta.url).pathname);

describe("coverage", () => {
  it("counts cases and videos per kg component", () => {
    const c = coverage(kg);
    expect(c.rows.find((r) => r.kg === "button")).toMatchObject({ cases: 3, videos: 3, promoted: false });
    expect(c.rows.find((r) => r.kg === "table")).toMatchObject({ cases: 0, videos: 0, promoted: false });
  });

  it("computes coverage over non-excluded ui components", () => {
    const c = coverage(kg);
    expect(c.caseCoverage).toBeCloseTo(6 / 8);
    expect(c.uncovered).toEqual(["Table", "DataTable"]);
  });

  it("marks promoted when a rule/option/quality scope names the component", () => {
    const c = coverage(kg);
    expect(c.rows.find((r) => r.kg === "card")!.promoted).toBe(true);
    expect(c.rows.find((r) => r.kg === "button")!.promoted).toBe(false);
    expect(c.promotedCoverage).toBeCloseTo(3 / 8);
  });
});
