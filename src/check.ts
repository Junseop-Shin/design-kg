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
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
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
  checked: number;
};

type CheckFn = (el: SnapshotElement, n: typeof num, contrast: typeof contrastRatio) => unknown;

const compiled = new Map<string, CheckFn>();

function evalCheck(rule: Rule, el: SnapshotElement): boolean {
  let fn = compiled.get(rule.check!);
  if (!fn) {
    fn = new Function("el", "num", "contrast", `"use strict"; return (${rule.check});`) as CheckFn;
    compiled.set(rule.check!, fn);
  }
  return Boolean(fn(el, num, contrastRatio));
}

export function check(kg: Kg, snapshot: Snapshot): CheckResult {
  const out: CheckResult = { violations: [], judgments: [], errors: [], checked: 0 };
  for (const el of snapshot.elements) {
    const q: ScopeQuery = {
      component: el.ui, platform: snapshot.platform, size: el.size as Scope["size"],
      variant: el.variant, context: el.context,
    };
    for (const rule of kg.rules) {
      if (rule.state !== el.state) continue;
      if (!matchesScope(rule.scope, q, "strict")) continue;
      out.checked += 1;
      if (rule.grade === "CHECKABLE") {
        try {
          if (!evalCheck(rule, el)) {
            out.violations.push({
              rule: rule.id, statement: rule.statement, selector: el.selector, state: el.state,
              actual: { box: el.box, style: el.style },
            });
          }
        } catch (e) {
          out.errors.push({ rule: rule.id, message: (e as Error).message });
        }
      } else {
        out.judgments.push({
          rule: rule.id, statement: rule.statement, selector: el.selector, state: el.state,
          element: el, cases: queryCases(kg, rule.id)?.cases ?? [],
        });
      }
    }
  }
  return out;
}
