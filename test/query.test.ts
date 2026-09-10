import { describe, expect, it } from "vitest";
import { loadKg } from "../src/load.js";
import { caseSummary, queryCases, queryOptions, queryQualities, queryRules } from "../src/query.js";
import { matchesScope } from "../src/scope.js";
import { Scope } from "../src/schema.js";

const kg = loadKg(new URL("./fixtures/kg", import.meta.url).pathname);

describe("matchesScope", () => {
  const button = Scope.parse({ component: "button", platform: "mobile" });
  it("matches when every non-any target field equals the query", () => {
    expect(matchesScope(button, { component: "button", platform: "mobile" })).toBe(true);
    expect(matchesScope(button, { component: "button", platform: "web" })).toBe(false);
    expect(matchesScope(button, { component: "card" })).toBe(false);
  });
  it("treats a missing or any query field as wildcard", () => {
    expect(matchesScope(button, {})).toBe(true);
    expect(matchesScope(button, { component: "button", platform: "any" })).toBe(true);
  });
  it("any on the target matches anything", () => {
    expect(matchesScope(Scope.parse({}), { component: "hero", platform: "web", size: "lg" })).toBe(true);
  });
  it("strict mode does not wildcard on the query side", () => {
    const hero = Scope.parse({ context: "hero" });
    expect(matchesScope(hero, { context: "any" }, "strict")).toBe(false);
    expect(matchesScope(hero, {}, "strict")).toBe(false);
    expect(matchesScope(hero, { context: "hero" }, "strict")).toBe(true);
    expect(matchesScope(Scope.parse({}), { context: "any" }, "strict")).toBe(true);
  });
});

describe("queryRules", () => {
  it("returns matching rules, CHECKABLE first, with conflicts resolved", () => {
    const r = queryRules(kg, { component: "button", platform: "mobile", context: "list" });
    expect(r.map((x) => x.id)).toEqual(["rule-001", "rule-002"]);
    expect(r[0].conflicts).toEqual([]);
  });
  it("treats unspecified fields as wildcard", () => {
    expect(queryRules(kg, { component: "button", platform: "mobile" }).map((x) => x.id))
      .toEqual(["rule-001", "rule-002", "rule-003"]);
  });
  it("excludes mobile-only rules on web and keeps hero JUDGMENT rules", () => {
    expect(queryRules(kg, { platform: "web", context: "hero" }).map((x) => x.id)).toEqual(["rule-002", "rule-003"]);
  });
  it("resolves conflicts_with into rules and drops unknown ids", () => {
    const withConflict = { ...kg, rules: [{ ...kg.rules[0], conflicts_with: ["rule-003"] }, kg.rules[1], kg.rules[2]] };
    expect(queryRules(withConflict, { platform: "mobile" })[0].conflicts.map((r) => r.id)).toEqual(["rule-003"]);
    const withUnknown = { ...kg, rules: [{ ...kg.rules[0], conflicts_with: ["rule-999"] }, kg.rules[1], kg.rules[2]] };
    expect(queryRules(withUnknown, { platform: "mobile" })[0].conflicts).toEqual([]);
  });
  it("breaks ties on equal grade and confidence by id", () => {
    const tied = {
      ...kg,
      rules: [{ ...kg.rules[1], id: "rule-010" }, { ...kg.rules[1], id: "rule-002" }],
    };
    expect(queryRules(tied, {}).map((r) => r.id)).toEqual(["rule-002", "rule-010"]);
  });
});

describe("queryOptions", () => {
  it("filters by scope", () => {
    expect(queryOptions(kg, { component: "card" }).map((o) => o.id)).toEqual(["option-001"]);
    expect(queryOptions(kg, { component: "button" })).toEqual([]);
  });
});

describe("queryQualities", () => {
  it("finds by label or alias", () => {
    expect(queryQualities(kg, "과감한")!.quality.id).toBe("quality-bold");
    expect(queryQualities(kg, " 대담한 ")!.quality.id).toBe("quality-bold");
    expect(queryQualities(kg, "없는말")).toBeNull();
  });
  it("sorts realized_by by weight and filters by scope", () => {
    const a = queryQualities(kg, "과감한")!;
    expect(a.realized_by.map((r) => r.property)).toEqual(["type-scale", "whitespace"]);
    const b = queryQualities(kg, "과감한", { context: "list" })!;
    expect(b.realized_by.map((r) => r.property)).toEqual(["whitespace"]);
  });
  it("resolves opposes and attaches scoped rules", () => {
    const a = queryQualities(kg, "과감한", { context: "hero", platform: "web" })!;
    expect(a.opposes!.id).toBe("quality-subtle");
    expect(a.rules.map((r) => r.id)).toEqual(["rule-002", "rule-003"]);
  });
});

describe("queryCases", () => {
  it("returns cases behind a rule with youtube links", () => {
    const r = queryCases(kg, "rule-001")!;
    expect(r.kind).toBe("rule");
    expect(r.cases.map((c) => c.id)).toEqual(["case-001", "case-002", "case-003"]);
    expect(r.cases[0].url).toBe("https://youtu.be/dQw4w9WgXcQ?t=252");
  });
  it("collects cases across option choices and quality realized_by", () => {
    expect(queryCases(kg, "option-001")!.cases.map((c) => c.id)).toEqual(["case-007"]);
    expect(queryCases(kg, "quality-bold")!.cases.map((c) => c.id)).toEqual(["case-004", "case-005", "case-006"]);
  });
  it("returns null for unknown ids", () => {
    expect(queryCases(kg, "rule-999")).toBeNull();
    expect(queryCases(kg, "case-001")).toBeNull();
  });
});

describe("caseSummary", () => {
  it("converts h:mm:ss", () => {
    const c = { ...kg.cases[0], source: { video: "dQw4w9WgXcQ", t: "1:02:03" } };
    expect(caseSummary(c).url).toBe("https://youtu.be/dQw4w9WgXcQ?t=3723");
  });
});
