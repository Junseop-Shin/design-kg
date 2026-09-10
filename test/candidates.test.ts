import { describe, expect, it } from "vitest";
import { qualityCandidates, ruleCandidates } from "../src/candidates.js";
import { loadKg } from "../src/load.js";

const kg = loadKg(new URL("./fixtures/kg", import.meta.url).pathname);

describe("ruleCandidates", () => {
  it("groups by component|property|direction across distinct videos", () => {
    const c = ruleCandidates(kg.cases);
    const touch = c.find((x) => x.key === "button|touch-target|up");
    expect(touch).toBeDefined();
    expect(touch!.videos).toHaveLength(3);
    expect(touch!.cases).toEqual(["case-001", "case-002", "case-003"]);
  });

  it("sends PRESCRIPTIVE majority to Rule with CHECKABLE when measured values agree", () => {
    const touch = ruleCandidates(kg.cases).find((x) => x.key === "button|touch-target|up")!;
    expect(touch.stance).toEqual({ PRESCRIPTIVE: 3, PREFERRED: 0, OPTION: 0 });
    expect(touch.destination).toBe("Rule");
    expect(touch.measured).toEqual({ values: [44, 44, 48], unit: "px", agree: true });
    expect(touch.grade).toBe("CHECKABLE");
  });

  it("sends non-PRESCRIPTIVE majority to Option", () => {
    const hero = ruleCandidates(kg.cases).find((x) => x.key === "hero|type-scale|up")!;
    expect(hero.destination).toBe("Option");
    expect(hero.grade).toBeNull();
  });

  it("drops groups under minVideos", () => {
    expect(ruleCandidates(kg.cases).find((x) => x.key === "card|radius|set")).toBeUndefined();
    expect(ruleCandidates(kg.cases, 1).find((x) => x.key === "card|radius|set")).toBeDefined();
  });

  it("treats a tie as Option", () => {
    const tie = kg.cases
      .filter((c) => c.property === "touch-target")
      .map((c, i) => ({ ...c, stance: i === 0 ? "PRESCRIPTIVE" as const : "OPTION" as const }));
    // 1 PRESCRIPTIVE vs 2 OPTION → Option; 2 vs 1 은 Rule
    expect(ruleCandidates(tie)[0].destination).toBe("Option");
    const two = tie.map((c, i) => ({ ...c, stance: i < 2 ? "PRESCRIPTIVE" as const : "OPTION" as const }));
    expect(ruleCandidates(two)[0].destination).toBe("Rule");
  });

  it("marks measured disagreement as JUDGMENT", () => {
    const spread = kg.cases
      .filter((c) => c.property === "touch-target")
      .map((c, i) => ({ ...c, measured: { prop: "touch-target", value: [44, 60, 30][i], unit: "px" } }));
    const r = ruleCandidates(spread)[0];
    expect(r.measured.agree).toBe(false);
    expect(r.grade).toBe("JUDGMENT");
  });
});

describe("qualityCandidates", () => {
  it("splits an entry with both sides into target and problem rows", () => {
    const q = qualityCandidates(kg.cases);
    expect(q).toEqual([
      { polarity: "target", adjective: "과감한", property: "type-scale", direction: "up", videos: ["dQw4w9WgXcQ", "aaaaaaaaaaa", "bbbbbbbbbbb"], cases: ["case-004", "case-005", "case-006"], weight: 3 },
      { polarity: "problem", adjective: "밋밋한", property: "type-scale", direction: "up", videos: ["dQw4w9WgXcQ", "aaaaaaaaaaa", "bbbbbbbbbbb"], cases: ["case-004", "case-005", "case-006"], weight: 3 },
    ]);
  });

  it("keeps only the problem row when the target is ?", () => {
    const cases = kg.cases
      .filter((c) => c.property === "touch-target")
      .map((c) => ({ ...c, qualities: ["큰→?"] }));
    const q = qualityCandidates(cases);
    expect(q).toEqual([
      { polarity: "problem", adjective: "큰", property: "touch-target", direction: "up", videos: ["dQw4w9WgXcQ", "aaaaaaaaaaa", "bbbbbbbbbbb"], cases: ["case-001", "case-002", "case-003"], weight: 3 },
    ]);
    expect(q.find((x) => x.adjective === "?")).toBeUndefined();
  });

  it("ignores stance entirely", () => {
    const all = kg.cases.map((c) => ({ ...c, stance: "OPTION" as const }));
    expect(qualityCandidates(all)).toHaveLength(2);
  });
});
