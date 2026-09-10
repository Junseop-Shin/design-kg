import { describe, expect, it } from "vitest";
import { check, contrastRatio, num } from "../src/check.js";
import { loadKg } from "../src/load.js";
import { Snapshot } from "../src/schema.js";

const kg = loadKg(new URL("./fixtures/kg", import.meta.url).pathname);

const el = (over: Record<string, unknown>) => ({
  ui: "button", selector: "[data-snap-id=\"0\"]", state: "default",
  box: { x: 0, y: 0, width: 120, height: 44 },
  style: { color: "rgb(0, 0, 0)", "background-color": "rgb(255, 255, 255)" },
  ...over,
});

const snap = (elements: unknown[], platform = "mobile") =>
  Snapshot.parse({ url: "file:///t.html", platform, viewport: { width: 390, height: 844 }, capturedAt: "2026-09-10T00:00:00Z", elements });

describe("num", () => {
  it("parses px and unitless", () => {
    expect(num("12px")).toBe(12);
    expect(num("1.5")).toBe(1.5);
    expect(num("0.75rem")).toBe(0.75);
    expect(Number.isNaN(num(undefined))).toBe(true);
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for same colors", () => {
    expect(contrastRatio("rgb(0, 0, 0)", "rgb(255, 255, 255)")).toBeCloseTo(21, 1);
    expect(contrastRatio("rgb(128, 128, 128)", "rgb(128, 128, 128)")).toBeCloseTo(1, 3);
  });
  it("is symmetric and ignores alpha", () => {
    expect(contrastRatio("rgba(255, 255, 255, 0.5)", "rgb(0, 0, 0)")).toBeCloseTo(21, 1);
  });
  it("returns NaN for unparsable input", () => {
    expect(Number.isNaN(contrastRatio("transparent", "rgb(0,0,0)"))).toBe(true);
  });
});

describe("check", () => {
  it("passes a compliant element", () => {
    const r = check(kg, snap([el({})]));
    expect(r.violations).toEqual([]);
    expect(r.checked).toBe(2);
  });

  it("flags a small touch target on mobile only", () => {
    const small = el({ box: { x: 0, y: 0, width: 120, height: 32 } });
    expect(check(kg, snap([small])).violations.map((v) => v.rule)).toEqual(["rule-001"]);
    expect(check(kg, snap([small], "web")).violations).toEqual([]);
  });

  it("flags low contrast with the actual values", () => {
    const grey = el({ style: { color: "rgb(150, 150, 150)", "background-color": "rgb(255, 255, 255)" } });
    const v = check(kg, snap([grey])).violations;
    expect(v.map((x) => x.rule)).toEqual(["rule-002"]);
    expect(v[0].actual.style.color).toBe("rgb(150, 150, 150)");
  });

  it("only evaluates a rule in its declared state", () => {
    const focused = el({ state: "focus-visible", box: { x: 0, y: 0, width: 120, height: 32 } });
    expect(check(kg, snap([focused])).violations).toEqual([]);
  });

  it("packages JUDGMENT rules per element with cases", () => {
    const hero = el({ ui: "hero", context: "hero" });
    const r = check(kg, snap([hero], "web"));
    expect(r.judgments).toHaveLength(1);
    expect(r.judgments[0].rule).toBe("rule-003");
    expect(r.judgments[0].cases.map((c) => c.id)).toEqual(["case-004"]);
  });

  it("reports a broken check expression instead of throwing", () => {
    const broken = { ...kg, rules: [{ ...kg.rules[0], check: "this is not js" }] };
    const r = check(broken, snap([el({})]));
    expect(r.errors[0].rule).toBe("rule-001");
    expect(r.violations).toEqual([]);
  });
});
