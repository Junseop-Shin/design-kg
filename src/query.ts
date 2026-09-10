import { matchesScope, type ScopeQuery } from "./scope.js";
import type { Case, Kg, Option, Quality, Rule, Stance } from "./schema.js";

export type Measured = NonNullable<Case["measured"]>;

export type CaseSummary = {
  id: string; video: string; t: string; url: string;
  problem: string; fix: string; stance: Stance; quote: string; measured?: Measured;
};

function toSeconds(t: string): number {
  return t.split(":").map(Number).reduce((acc, n) => acc * 60 + n, 0);
}

export function caseSummary(c: Case): CaseSummary {
  return {
    id: c.id, video: c.source.video, t: c.source.t,
    url: `https://youtu.be/${c.source.video}?t=${toSeconds(c.source.t)}`,
    problem: c.problem, fix: c.fix, stance: c.stance, quote: c.quote,
    ...(c.measured ? { measured: c.measured } : {}),
  };
}

export function queryRules(kg: Kg, q: ScopeQuery): Array<Rule & { conflicts: Rule[] }> {
  const byId = new Map(kg.rules.map((r) => [r.id, r]));
  return kg.rules
    .filter((r) => matchesScope(r.scope, q))
    .sort((a, b) =>
      (a.grade === b.grade ? 0 : a.grade === "CHECKABLE" ? -1 : 1) ||
      b.confidence - a.confidence ||
      a.id.localeCompare(b.id),
    )
    .map((r) => ({ ...r, conflicts: r.conflicts_with.map((id) => byId.get(id)!).filter(Boolean) }));
}

export function queryOptions(kg: Kg, q: ScopeQuery): Option[] {
  return kg.options.filter((o) => matchesScope(o.scope, q));
}

export type QualityAnswer = {
  quality: Quality;
  realized_by: Quality["realized_by"];
  opposes: Quality | null;
  rules: Rule[];
};

export function queryQualities(kg: Kg, term: string, q: ScopeQuery = {}): QualityAnswer | null {
  const t = term.trim();
  const quality = kg.qualities.find((x) => x.label === t || x.aliases.includes(t));
  if (!quality) return null;
  const realized_by = quality.realized_by
    .filter((rb) => !rb.scope || matchesScope(rb.scope, q))
    .sort((a, b) => b.weight - a.weight);
  const opposes = quality.opposes ? kg.qualities.find((x) => x.id === quality.opposes) ?? null : null;
  return { quality, realized_by, opposes, rules: queryRules(kg, q) };
}

export function queryCases(kg: Kg, id: string) {
  const byId = new Map(kg.cases.map((c) => [c.id, c]));
  const summarize = (ids: string[]) =>
    [...new Set(ids)].map((x) => byId.get(x)).filter((c): c is Case => !!c).map(caseSummary);

  if (id.startsWith("rule-")) {
    const node = kg.rules.find((r) => r.id === id);
    return node ? { kind: "rule" as const, node, cases: summarize(node.promoted_from) } : null;
  }
  if (id.startsWith("option-")) {
    const node = kg.options.find((o) => o.id === id);
    return node ? { kind: "option" as const, node, cases: summarize(node.choices.flatMap((c) => c.cases)) } : null;
  }
  if (id.startsWith("quality-")) {
    const node = kg.qualities.find((x) => x.id === id);
    return node ? { kind: "quality" as const, node, cases: summarize(node.realized_by.flatMap((r) => r.cases)) } : null;
  }
  return null;
}
