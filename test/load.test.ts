import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { KgLoadError, loadKg } from "../src/load.js";

const FIX = new URL("./fixtures/kg", import.meta.url).pathname;

describe("loadKg", () => {
  it("loads the fixture graph", () => {
    const kg = loadKg(FIX);
    expect(kg.videos).toHaveLength(3);
    expect(kg.cases).toHaveLength(7);
    expect(kg.rules).toHaveLength(3);
    expect(kg.options).toHaveLength(1);
    expect(kg.qualities).toHaveLength(2);
  });

  it("returns empty lists for a graph with no files", () => {
    const dir = mkdtempSync(join(tmpdir(), "kg-"));
    const kg = loadKg(dir);
    expect(kg.cases).toEqual([]);
    expect(kg.rules).toEqual([]);
  });

  it("reports the file and path of a schema error", () => {
    const dir = mkdtempSync(join(tmpdir(), "kg-"));
    writeFileSync(join(dir, "rules.yaml"), "- id: rule-001\n  statement: x\n  grade: CHECKABLE\n  property: p\n");
    expect(() => loadKg(dir)).toThrow(KgLoadError);
    try { loadKg(dir); } catch (e) {
      const err = e as KgLoadError;
      expect(err.file).toContain("rules.yaml");
      expect(err.issues.join(" ")).toContain("check");
    }
  });

  it("rejects dangling case references", () => {
    const dir = mkdtempSync(join(tmpdir(), "kg-"));
    mkdirSync(join(dir, "cases"));
    writeFileSync(join(dir, "rules.yaml"),
      "- id: rule-001\n  statement: x\n  grade: JUDGMENT\n  property: p\n  promoted_from: [case-999]\n");
    expect(() => loadKg(dir)).toThrow(/case-999/);
  });

  it("rejects a case whose video is not in videos.yaml", () => {
    const dir = mkdtempSync(join(tmpdir(), "kg-"));
    mkdirSync(join(dir, "cases"));
    writeFileSync(join(dir, "cases", "x.yaml"), `
- id: case-001
  source: { video: zzzzzzzzzzz, t: "00:10" }
  property: p
  problem: a
  fix: b
  stance: OPTION
  quote: q
`);
    expect(() => loadKg(dir)).toThrow(/zzzzzzzzzzz/);
  });

  it("rejects duplicate case ids across files", () => {
    const dir = mkdtempSync(join(tmpdir(), "kg-"));
    mkdirSync(join(dir, "cases"));
    writeFileSync(join(dir, "videos.yaml"),
      "- { id: dQw4w9WgXcQ, title: t, url: 'https://youtu.be/dQw4w9WgXcQ', category: review, subtitles: auto, reason: r }\n");
    const c = `- id: case-001\n  source: { video: dQw4w9WgXcQ, t: "00:10" }\n  property: p\n  problem: a\n  fix: b\n  stance: OPTION\n  quote: q\n`;
    writeFileSync(join(dir, "cases", "a.yaml"), c);
    writeFileSync(join(dir, "cases", "b.yaml"), c);
    expect(() => loadKg(dir)).toThrow(/duplicate/);
  });
});
