import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { z } from "zod";
import { Case, Option, Quality, Rule, Video, type Kg } from "./schema.js";

export class KgLoadError extends Error {
  constructor(public file: string, public issues: string[]) {
    super(`${file}: ${issues.join("; ")}`);
    this.name = "KgLoadError";
  }
}

function parseList<T>(file: string, schema: z.ZodType<T>): T[] {
  if (!existsSync(file)) return [];
  const raw = parse(readFileSync(file, "utf8")) ?? [];
  const result = z.array(schema).safeParse(raw);
  if (!result.success) {
    throw new KgLoadError(
      file,
      result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    );
  }
  return result.data;
}

export function loadKg(dir: string): Kg {
  const casesDir = join(dir, "cases");
  const caseFiles = existsSync(casesDir)
    ? readdirSync(casesDir).filter((f) => f.endsWith(".yaml")).sort()
    : [];
  const kg: Kg = {
    videos: parseList(join(dir, "videos.yaml"), Video),
    cases: caseFiles.flatMap((f) => parseList(join(casesDir, f), Case)),
    rules: parseList(join(dir, "rules.yaml"), Rule),
    options: parseList(join(dir, "options.yaml"), Option),
    qualities: parseList(join(dir, "qualities.yaml"), Quality),
  };
  checkReferences(kg);
  return kg;
}

function checkReferences(kg: Kg): void {
  const caseIds = kg.cases.map((c) => c.id);
  const dup = [...new Set(caseIds.filter((id, i) => caseIds.indexOf(id) !== i))];
  if (dup.length) throw new KgLoadError("cases", [`duplicate case ids: ${dup.join(", ")}`]);

  const cases = new Set(caseIds);
  const videos = new Set(kg.videos.map((v) => v.id));
  const rules = new Set(kg.rules.map((r) => r.id));
  const qualities = new Set(kg.qualities.map((q) => q.id));
  const missing: string[] = [];
  const need = (from: string, id: string, set: Set<string>) => {
    if (!set.has(id)) missing.push(`${from} → ${id}`);
  };

  for (const c of kg.cases) need(c.id, c.source.video, videos);
  for (const r of kg.rules) {
    r.promoted_from.forEach((id) => need(r.id, id, cases));
    r.conflicts_with.forEach((id) => need(r.id, id, rules));
  }
  for (const o of kg.options)
    for (const ch of o.choices) ch.cases.forEach((id) => need(o.id, id, cases));
  for (const q of kg.qualities) {
    for (const rb of q.realized_by) rb.cases.forEach((id) => need(q.id, id, cases));
    if (q.opposes) need(q.id, q.opposes, qualities);
  }
  if (missing.length) throw new KgLoadError("references", missing);
}
