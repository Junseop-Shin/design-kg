import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { check } from "../src/check.js";
import { loadKg } from "../src/load.js";
import { queryCases, queryOptions, queryQualities, queryRules } from "../src/query.js";
import { Snapshot } from "../src/schema.js";

const scopeShape = {
  component: z.string().optional().describe("button | input | card | list | nav | hero | form | modal | typo | color | layout | any"),
  platform: z.enum(["mobile", "web", "any"]).optional(),
  size: z.enum(["sm", "md", "lg", "any"]).optional(),
  variant: z.string().optional().describe("primary | secondary | ghost | outline | any"),
  context: z.string().optional().describe("요소가 놓인 자리: list | hero | form | modal | nav | any"),
};

const json = (v: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(v, null, 2) }] });
const fail = (msg: string) => ({ content: [{ type: "text" as const, text: msg }], isError: true });

export function createServer(kgDir: string): McpServer {
  const kg = loadKg(kgDir);
  const server = new McpServer({ name: "design-kg", version: "0.1.0" });

  server.registerTool(
    "design_rules",
    {
      title: "Design rules",
      description:
        "UI를 만들기 전에 지켜야 할 규칙을 조회한다. scope(component · platform · size · variant · context)에 맞는 Rule을 " +
        "CHECKABLE 우선으로 돌려주고, 서로 충돌하는 규칙은 conflicts에 같이 담는다. 생략한 scope 필드는 전체 매칭.",
      inputSchema: scopeShape,
    },
    async (q) => json(queryRules(kg, q)),
  );

  server.registerTool(
    "design_options",
    {
      title: "Design options",
      description:
        "어느 쪽을 골라도 틀리지 않는 선택지 카탈로그. 각 choice에 언제 쓰는지(when)와 코퍼스가 권장한 쪽(recommended)이 있다. 강제가 아니다.",
      inputSchema: scopeShape,
    },
    async (q) => json(queryOptions(kg, q)),
  );

  server.registerTool(
    "design_qualities",
    {
      title: "Design qualities",
      description:
        "'과감한' '고급스러운' 같은 디자인 형용사를 받아 어떤 속성(property)을 어느 방향(direction)으로 움직여야 그 인상이 나는지 돌려준다. " +
        "realized_by는 근거 사례 수(weight) 순이고 scope로 걸러진다. 다 적용하라는 뜻이 아니라 후보 목록이다. " +
        "`polarity`가 problem이면 그 형용사는 고쳐야 할 인상이고 realized_by는 그 인상을 없애는 방향이다. " +
        "반대 형용사(opposes)와 그 scope의 Rule도 같이 준다. 모르는 형용사면 found:false와 아는 형용사 목록을 준다.",
      inputSchema: { term: z.string().describe("형용사. 예: 과감한, 차분한, 따뜻한"), ...scopeShape },
    },
    async ({ term, ...q }) => {
      const a = queryQualities(kg, term, q);
      if (!a) return json({ found: false, known: kg.qualities.flatMap((x) => [x.label, ...x.aliases]) });
      return json({ found: true, ...a });
    },
  );

  server.registerTool(
    "design_cases",
    {
      title: "Design cases",
      description: "Rule · Option · Quality의 근거가 된 영상 사례. before/after 요약과 타임스탬프 링크(youtu.be/<id>?t=초)를 준다.",
      inputSchema: { id: z.string().describe("rule-NNN | option-NNN | quality-xxx") },
    },
    async ({ id }) => {
      const r = queryCases(kg, id);
      return r ? json(r) : fail(`unknown id: ${id}`);
    },
  );

  server.registerTool(
    "design_check",
    {
      title: "Design check",
      description:
        "렌더된 페이지의 스냅샷(npm run snapshot 출력 JSON 경로)을 Rule로 검증한다. CHECKABLE은 기계 판정해 violations로, " +
        "JUDGMENT는 요소별로 근거 사례를 붙여 judgments로 돌려주니 그건 호출자가 판단한다. 판정식이 터진 Rule은 errors에 담고, " +
        "evaluated는 실제로 돌린 Rule × 요소 판정 횟수다. Option · Quality는 판정하지 않는다.",
      inputSchema: { snapshot_path: z.string().describe("scripts/snapshot.ts가 만든 JSON 파일의 경로") },
    },
    async ({ snapshot_path }) => {
      let snap: Snapshot;
      try {
        snap = Snapshot.parse(JSON.parse(readFileSync(snapshot_path, "utf8")));
      } catch (e) {
        return fail(`invalid snapshot ${snapshot_path}: ${(e as Error).message}`);
      }
      return json(check(kg, snap));
    },
  );

  return server;
}
