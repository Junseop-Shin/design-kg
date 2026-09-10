import type { Case, Stance } from "./schema.js";

export type RuleCandidate = {
  key: string;
  component: string;
  property: string;
  direction: string;
  videos: string[];
  cases: string[];
  stance: Record<Stance, number>;
  destination: "Rule" | "Option";
  measured: { values: number[]; unit: string | null; agree: boolean };
  grade: "CHECKABLE" | "JUDGMENT" | null;
};

export type QualityCandidate = {
  polarity: "target" | "problem";
  adjective: string;
  property: string;
  direction: string;
  videos: string[];
  cases: string[];
  weight: number;
};

const uniq = <T>(xs: T[]) => [...new Set(xs)];

function groupBy<T>(items: T[], key: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    m.set(k, [...(m.get(k) ?? []), it]);
  }
  return m;
}

// 값들이 중앙값의 ±10% 안에 있으면 일치로 본다
function valuesAgree(values: number[]): boolean {
  if (values.length < 2) return false;
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return values.every((v) => Math.abs(v - median) <= Math.abs(median) * 0.1);
}

export function ruleCandidates(cases: Case[], minVideos = 3): RuleCandidate[] {
  const out: RuleCandidate[] = [];
  const groups = groupBy(cases, (c) => `${c.scope.component}|${c.property}|${c.direction}`);
  for (const [key, group] of groups) {
    const videos = uniq(group.map((c) => c.source.video));
    if (videos.length < minVideos) continue;
    const stance: Record<Stance, number> = { PRESCRIPTIVE: 0, PREFERRED: 0, OPTION: 0 };
    for (const c of group) stance[c.stance] += 1;
    const destination = stance.PRESCRIPTIVE > stance.PREFERRED + stance.OPTION ? "Rule" : "Option";
    const measuredCases = group.filter((c) => c.measured);
    const values = measuredCases.map((c) => c.measured!.value);
    const unit = measuredCases[0]?.measured!.unit ?? null;
    const agree = valuesAgree(values);
    const [component, property, direction] = key.split("|");
    out.push({
      key, component, property, direction, videos,
      cases: group.map((c) => c.id),
      stance, destination,
      measured: { values, unit, agree },
      grade: destination === "Rule" ? (agree ? "CHECKABLE" : "JUDGMENT") : null,
    });
  }
  return out.sort((a, b) => b.videos.length - a.videos.length || a.key.localeCompare(b.key));
}

export function qualityCandidates(cases: Case[], minVideos = 3): QualityCandidate[] {
  type Row = { polarity: "target" | "problem"; adjective: string; case: Case };
  // 한쪽이 ?면 나머지 한쪽만 후보가 된다. 둘 다 실제 형용사면 두 행으로 쪼갠다
  const rows: Row[] = cases.flatMap((c) =>
    c.qualities.flatMap((q) => {
      const [current, target] = q.split("→").map((s) => s.trim());
      const made: Row[] = [];
      if (target !== "?") made.push({ polarity: "target", adjective: target, case: c });
      if (current !== "?") made.push({ polarity: "problem", adjective: current, case: c });
      return made;
    }),
  );
  const out: QualityCandidate[] = [];
  const groups = groupBy(
    rows,
    (r) => `${r.polarity}|${r.adjective}|${r.case.property}|${r.case.direction}`,
  );
  for (const [key, group] of groups) {
    const videos = uniq(group.map((r) => r.case.source.video));
    if (videos.length < minVideos) continue;
    const [polarity, adjective, property, direction] = key.split("|");
    out.push({
      polarity: polarity as "target" | "problem",
      adjective, property, direction, videos,
      cases: group.map((r) => r.case.id),
      weight: group.length,
    });
  }
  return out.sort((a, b) => b.weight - a.weight || a.adjective.localeCompare(b.adjective));
}
