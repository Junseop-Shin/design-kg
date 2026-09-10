import { describe, expect, it } from "vitest";
import { Case, Quality, Rule, Scope, Snapshot } from "../src/schema.js";

describe("Scope", () => {
  it("defaults every field to any", () => {
    expect(Scope.parse({})).toEqual({
      component: "any", platform: "any", size: "any", variant: "any", context: "any",
    });
  });
});

describe("Case", () => {
  const base = {
    id: "case-001",
    source: { video: "dQw4w9WgXcQ", t: "04:12" },
    scope: { component: "button", platform: "mobile" },
    property: "touch-target",
    direction: "up",
    problem: "버튼이 너무 작다",
    fix: "높이를 44로",
    stance: "PRESCRIPTIVE",
    quote: "터치 영역은 무조건 44 이상 잡으셔야 돼요",
  };

  it("parses a minimal case and fills defaults", () => {
    const c = Case.parse(base);
    expect(c.scope.size).toBe("any");
    expect(c.qualities).toEqual([]);
    expect(c.rationale).toBe("");
  });

  it("rejects a bad id", () => {
    expect(() => Case.parse({ ...base, id: "c1" })).toThrow();
  });

  it("rejects a bad timestamp", () => {
    expect(() => Case.parse({ ...base, source: { video: "dQw4w9WgXcQ", t: "4분12초" } })).toThrow();
  });

  it("requires qualities in 현재→목표 form", () => {
    expect(Case.parse({ ...base, qualities: ["밋밋한→과감한"] }).qualities).toEqual(["밋밋한→과감한"]);
    expect(() => Case.parse({ ...base, qualities: ["과감한"] })).toThrow();
  });
});

describe("Rule", () => {
  const base = {
    id: "rule-001",
    statement: "모바일 터치 타겟은 최소 44px",
    grade: "CHECKABLE",
    scope: { platform: "mobile" },
    property: "touch-target",
    check: "Math.min(el.box.width, el.box.height) >= 44",
  };

  it("requires check when CHECKABLE", () => {
    expect(() => Rule.parse({ ...base, check: undefined })).toThrow();
    expect(Rule.parse({ ...base, grade: "JUDGMENT", check: undefined }).grade).toBe("JUDGMENT");
  });

  it("defaults source to corpus and state to default", () => {
    const r = Rule.parse(base);
    expect(r.source).toBe("corpus");
    expect(r.state).toBe("default");
    expect(r.conflicts_with).toEqual([]);
  });
});

describe("Quality", () => {
  it("parses realized_by with weight", () => {
    const q = Quality.parse({
      id: "quality-bold",
      label: "과감한",
      realized_by: [{ property: "type-scale", direction: "up", weight: 2, cases: ["case-001", "case-002"] }],
    });
    expect(q.aliases).toEqual([]);
    expect(q.realized_by[0].weight).toBe(2);
  });

  it("defaults polarity to target", () => {
    const q = Quality.parse({ id: "quality-bold", label: "과감한" });
    expect(q.polarity).toBe("target");
    expect(Quality.parse({ id: "quality-big", label: "큰", polarity: "problem" }).polarity).toBe("problem");
  });

  it("accepts direction other for structure-type advice", () => {
    const q = Quality.parse({
      id: "quality-cluttered",
      label: "복잡한",
      polarity: "problem",
      realized_by: [{ property: "structure", direction: "other", weight: 2, cases: ["case-001"] }],
    });
    expect(q.realized_by[0].direction).toBe("other");
  });

  it("requires value when direction is set", () => {
    expect(() => Quality.parse({
      id: "quality-x", label: "x",
      realized_by: [{ property: "radius", direction: "set", weight: 1, cases: ["case-001"] }],
    })).toThrow();
  });
});

describe("Snapshot", () => {
  it("parses an element", () => {
    const s = Snapshot.parse({
      url: "file:///x.html", platform: "web", viewport: { width: 1280, height: 800 },
      capturedAt: "2026-09-10T00:00:00Z",
      elements: [{
        ui: "button", selector: '[data-snap-id="0"]', state: "default",
        box: { x: 0, y: 0, width: 120, height: 40 },
        style: { color: "rgb(0, 0, 0)" },
      }],
    });
    expect(s.elements[0].variant).toBe("any");
    expect(s.elements[0].context).toBe("any");
  });
});
