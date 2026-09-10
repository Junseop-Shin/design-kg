import type { Kg } from "./schema.js";

export type CoverageRow = {
  kg: string;
  ui: string[];
  cases: number;
  videos: number;
  promoted: boolean;
};

export type Coverage = {
  rows: CoverageRow[];
  caseCoverage: number;
  promotedCoverage: number;
  uncovered: string[];
};

export function coverage(kg: Kg): Coverage {
  const promotedKg = new Set<string>();
  for (const r of kg.rules) if (r.scope.component !== "any") promotedKg.add(r.scope.component);
  for (const o of kg.options) if (o.scope.component !== "any") promotedKg.add(o.scope.component);
  for (const q of kg.qualities)
    for (const rb of q.realized_by)
      if (rb.scope && rb.scope.component !== "any") promotedKg.add(rb.scope.component);

  const rows: CoverageRow[] = kg.components
    .filter((m) => !m.exclude)
    .map((m) => {
      const cases = kg.cases.filter((c) => c.scope.component === m.kg);
      return {
        kg: m.kg,
        ui: m.ui,
        cases: cases.length,
        videos: new Set(cases.map((c) => c.source.video)).size,
        promoted: promotedKg.has(m.kg),
      };
    });

  const denom = rows.flatMap((r) => r.ui);
  const covered = rows.filter((r) => r.cases > 0).flatMap((r) => r.ui);
  const promoted = rows.filter((r) => r.promoted).flatMap((r) => r.ui);
  const uncovered = rows
    .filter((r) => r.cases === 0)
    .sort((a, b) => b.ui.length - a.ui.length)
    .flatMap((r) => r.ui);

  return {
    rows,
    caseCoverage: denom.length ? covered.length / denom.length : 0,
    promotedCoverage: denom.length ? promoted.length / denom.length : 0,
    uncovered,
  };
}
