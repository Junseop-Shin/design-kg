import { queryCases, type CaseSummary } from "./query.js";
import { matchesScope, type ScopeQuery } from "./scope.js";
import type { Kg, Rule, Scope, Snapshot, SnapshotElement } from "./schema.js";

export function num(s: string | undefined): number {
  if (s === undefined) return Number.NaN;
  const m = /-?\d*\.?\d+/.exec(s);
  return m ? Number.parseFloat(m[0]) : Number.NaN;
}

function parseRgb(s: string): [number, number, number] | null {
  const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(s);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  // #rgb · #rrggbb · #rrggbbaa (알파는 rgba()와 마찬가지로 무시한다)
  const h = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(s.trim());
  if (!h) return null;
  const d = h[1].length === 3 ? [...h[1]].map((c) => c + c).join("") : h[1];
  return [0, 2, 4].map((i) => Number.parseInt(d.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(fg: string, bg: string): number {
  const a = parseRgb(fg);
  const b = parseRgb(bg);
  if (!a || !b) return Number.NaN;
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export type Violation = {
  rule: string; statement: string; selector: string; state: string;
  actual: { box: SnapshotElement["box"]; style: Record<string, string> };
};
export type JudgmentItem = {
  rule: string; statement: string; selector: string; state: string;
  element: SnapshotElement; cases: CaseSummary[];
};
export type CheckResult = {
  violations: Violation[];
  judgments: JudgmentItem[];
  errors: Array<{ rule: string; message: string }>;
  evaluated: number;
};

// 파싱 못 하는 색은 NaN 비교로 조용히 위반이 되는 대신 오류로 올라가야 한다.
// 내보낸 contrastRatio의 NaN 계약은 그대로 두고 여기서만 감싼다.
function strictContrast(fg: string, bg: string): number {
  const r = contrastRatio(fg, bg);
  if (Number.isNaN(r)) throw new Error(`unparsable color: ${fg} / ${bg}`);
  return r;
}

type CheckFn = (el: SnapshotElement, n: typeof num, contrast: typeof contrastRatio) => unknown;
type Compiled = { fn: CheckFn } | { error: Error };

const compiled = new Map<string, Compiled>();

function compile(src: string): Compiled {
  let c = compiled.get(src);
  if (!c) {
    try {
      c = { fn: new Function("el", "num", "contrast", `"use strict"; return (${src});`) as CheckFn };
    } catch (e) {
      c = { error: e as Error };
    }
    compiled.set(src, c);
  }
  return c;
}

function evalCheck(rule: Rule, el: SnapshotElement): boolean {
  const c = compile(rule.check!);
  if ("error" in c) throw c.error;
  return Boolean(c.fn(el, num, strictContrast));
}

export function check(kg: Kg, snapshot: Snapshot): CheckResult {
  const out: CheckResult = { violations: [], judgments: [], errors: [], evaluated: 0 };
  const reported = new Set<string>();
  const casesByRule = new Map<string, CaseSummary[]>();
  const casesFor = (id: string) => {
    let cs = casesByRule.get(id);
    if (!cs) {
      cs = queryCases(kg, id)?.cases ?? [];
      casesByRule.set(id, cs);
    }
    return cs;
  };
  for (const el of snapshot.elements) {
    const q: ScopeQuery = {
      component: el.ui, platform: snapshot.platform, size: el.size as Scope["size"],
      variant: el.variant, context: el.context,
    };
    for (const rule of kg.rules) {
      if (rule.state !== el.state) continue;
      if (!matchesScope(rule.scope, q, "strict")) continue;
      out.evaluated += 1;
      if (rule.grade === "CHECKABLE") {
        try {
          if (!evalCheck(rule, el)) {
            out.violations.push({
              rule: rule.id, statement: rule.statement, selector: el.selector, state: el.state,
              actual: { box: el.box, style: el.style },
            });
          }
        } catch (e) {
          if (!reported.has(rule.id)) {
            reported.add(rule.id);
            out.errors.push({ rule: rule.id, message: (e as Error).message });
          }
        }
      } else {
        out.judgments.push({
          rule: rule.id, statement: rule.statement, selector: el.selector, state: el.state,
          element: el, cases: casesFor(rule.id),
        });
      }
    }
  }
  return out;
}
