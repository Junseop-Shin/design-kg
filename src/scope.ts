import type { Scope } from "./schema.js";

export type ScopeQuery = Partial<Scope>;

const KEYS = ["component", "platform", "size", "variant", "context"] as const;

export function matchesScope(target: Scope, q: ScopeQuery, mode: "query" | "strict" = "query"): boolean {
  return KEYS.every((k) => {
    const t = target[k];
    const v = q[k];
    if (t === "any") return true;
    if (mode === "query" && (v === undefined || v === "any")) return true;
    return t === v;
  });
}
