import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../mcp/server.js";

const FIX = new URL("./fixtures/kg", import.meta.url).pathname;
let client: Client;

const call = async (name: string, args: Record<string, unknown>) => {
  const r = await client.callTool({ name, arguments: args });
  const text = (r.content as Array<{ type: string; text: string }>)[0].text;
  return JSON.parse(text);
};

beforeAll(async () => {
  const [ct, st] = InMemoryTransport.createLinkedPair();
  const server = createServer(FIX);
  client = new Client({ name: "test", version: "0.0.0" });
  await server.connect(st);
  await client.connect(ct);
});

describe("design-kg mcp", () => {
  it("exposes exactly five tools", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      "design_cases", "design_check", "design_options", "design_qualities", "design_rules",
    ]);
  });

  it("design_rules", async () => {
    const r = await call("design_rules", { component: "button", platform: "mobile", context: "list" });
    expect(r.map((x: { id: string }) => x.id)).toEqual(["rule-001", "rule-002"]);
  });

  it("design_options", async () => {
    const r = await call("design_options", { component: "card" });
    expect(r[0].id).toBe("option-001");
  });

  it("design_qualities", async () => {
    const r = await call("design_qualities", { term: "과감한", context: "hero" });
    expect(r.quality.id).toBe("quality-bold");
    expect(r.realized_by[0].property).toBe("type-scale");
    expect(r.opposes.id).toBe("quality-subtle");
  });

  it("design_qualities unknown term returns a hint, not an error", async () => {
    const r = await call("design_qualities", { term: "없음" });
    expect(r.found).toBe(false);
    expect(r.known).toContain("과감한");
  });

  it("design_cases", async () => {
    const r = await call("design_cases", { id: "rule-001" });
    expect(r.cases).toHaveLength(3);
    expect(r.cases[0].url).toMatch(/^https:\/\/youtu\.be\//);
  });

  it("design_check reads a snapshot file", async () => {
    const path = join(tmpdir(), `snap-${Date.now()}.json`);
    writeFileSync(path, JSON.stringify({
      url: "file:///x", platform: "mobile", viewport: { width: 390, height: 844 }, capturedAt: "2026-09-10T00:00:00Z",
      elements: [{ ui: "button", selector: "[data-snap-id=\"0\"]", state: "default",
        box: { x: 0, y: 0, width: 100, height: 30 },
        style: { color: "rgb(0, 0, 0)", "background-color": "rgb(255, 255, 255)" } }],
    }));
    const r = await call("design_check", { snapshot_path: path });
    expect(r.violations.map((v: { rule: string }) => v.rule)).toEqual(["rule-001"]);
  });

  it("design_check reports an invalid snapshot as isError", async () => {
    const path = join(tmpdir(), `bad-${Date.now()}.json`);
    writeFileSync(path, "{}");
    const r = await client.callTool({ name: "design_check", arguments: { snapshot_path: path } });
    expect(r.isError).toBe(true);
  });
});
