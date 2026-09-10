# design-kg 3~5단계 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Madia Designer 영상 20개에서 Case를 뽑아 Rule / Option / Quality로 승격하고, 그걸 조회·검증하는 MCP 서버(툴 5개)를 Claude Code에 붙여 왕복 1회를 기록한다.

**Architecture:** 지식은 `kg/` 아래 YAML 파일이고, `src/`의 순수 함수(로딩·조회·검증·승격 후보 계산)가 그걸 읽는다. `mcp/`는 그 함수를 stdio MCP 툴로 노출하는 얇은 껍데기다. `scripts/`는 사람이 돌리는 CLI(검증·후보 표·스냅샷·자막 변환)다. 영상 추출은 스크립트가 아니라 절차 문서(`docs/extraction-guide.md`)를 따라 사람+LLM이 한다.

**Tech Stack:** Node 22+ · TypeScript · zod 4 · yaml · vitest · tsx · `@modelcontextprotocol/sdk` 1.x (stdio) · Playwright(chromium) · yt-dlp · ffmpeg

**Spec:** `docs/plan.md` — 이 플랜은 그 문서의 3~5단계를 구현한다. 실행자는 둘 다 읽는다.

**실행 모델:** 태스크 제목의 태그를 따른다. `[Opus]`는 코드 태스크, `[Sonnet]`은 데이터·절차 태스크.

## Global Constraints

- 레포는 public이다. `.evidence/`(자막·영상·프레임 원본·스냅샷)는 절대 커밋하지 않는다. 그래프에는 추출 결과와 출처(영상 ID + 타임스탬프)만 들어간다
- 저장 형식은 YAML 파일 + 로딩 스크립트. GraphDB 없음
- MCP 툴은 정확히 5개: `design_rules` `design_options` `design_qualities` `design_cases` `design_check`
- `design_check`는 Rule만 판정한다. Option · Quality는 판정 대상이 아니다
- Quality 승격은 stance를 보지 않는다. Rule 승격은 반복(영상 3개 이상) × 어조(PRESCRIPTIVE 우세) 2축이고, 명문 규격 일치 시 어조 무관 Rule(`source: standard`)
- 4단계 통과 조건: Quality 5개 이상, 각각 `realized_by` 2개 이상
- 문서·커밋 설명은 한국어, 코드·식별자·파일명은 영어. Conventional Commits `type(scope): 한국어 설명`
- 커밋은 feature 브랜치에서. main 직접 커밋 금지. PR은 squash merge. **실행 시작 시 사용자에게 "태스크별 커밋" 승인을 한 번 받는다**
- 브랜치: T1~T3 `feat/kg-schema` · T4~T6 `feat/corpus` · T7~T8 `feat/promotion` · T9~T12 `feat/mcp` · T13 `docs/roundtrip-01`
- 상대 import는 `.js` 확장자를 붙인다 (`moduleResolution: NodeNext`)

## 파일 구조

```
design-kg/
  package.json  tsconfig.json  vitest.config.ts  .mcp.json
  src/
    schema.ts        zod 스키마 + 타입. Case · Rule · Option · Quality · Video · Snapshot · Kg
    load.ts          loadKg(dir) — YAML 읽고 참조 무결성 검사
    scope.ts         matchesScope(target, query)
    query.ts         queryRules · queryOptions · queryQualities · queryCases · caseSummary
    check.ts         check(kg, snapshot) — CHECKABLE 식 평가 · JUDGMENT 묶음 · contrastRatio
    candidates.ts    ruleCandidates · qualityCandidates — 승격 후보 계산
    coverage.ts      coverage(kg) — my-ui-lib 컴포넌트 커버리지
  scripts/
    validate.ts      CLI: kg/ 검증
    candidates.ts    CLI: 승격 후보 표 출력
    coverage.ts      CLI: 커버리지 표 + 미커버 컴포넌트
    snapshot.ts      CLI: Playwright로 페이지 → 스냅샷 JSON
    vtt2txt.ts       CLI: WebVTT 자막 → [m:ss] 텍스트
  mcp/
    server.ts        createServer(kgDir) — 툴 5개 등록
    index.ts         stdio 진입점
  test/
    *.test.ts
    fixtures/kg/     테스트용 작은 KG
    fixtures/page.html   스냅샷 테스트용 페이지
    fixtures/sample.vtt
  kg/
    videos.yaml  components.yaml  cases/<videoId>.yaml  rules.yaml  options.yaml  qualities.yaml  promotion-log.md
  docs/
    plan.md  implementation-plan.md  extraction-guide.md  schema.md  roundtrip-01.md
  .evidence/       gitignore. 자막·영상·프레임·스냅샷
```

의존 순서: T1→T2→T3 (스키마·검증기) → T5→T4→T6a→T6b (코퍼스·추출) → T6c→T6d (커버리지 증분) → T7→T8 (승격) → T9→T10→T11→T12 (MCP) → T13.

---

### Task 1: 프로젝트 골격 [Opus]

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `test/smoke.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `npm test` · `npm run typecheck` · `npm run validate` · `npm run candidates` · `npm run snapshot` · `npm run vtt2txt` · `npm run mcp` 스크립트 이름. 이후 태스크가 전부 이 이름으로 부른다

- [ ] **Step 1: 브랜치**

```bash
cd ~/Documents/Work/Projects/design-kg && git checkout -b feat/kg-schema
```

- [ ] **Step 2: package.json 작성**

```json
{
  "name": "design-kg",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "validate": "tsx scripts/validate.ts",
    "candidates": "tsx scripts/candidates.ts",
    "snapshot": "tsx scripts/snapshot.ts",
    "vtt2txt": "tsx scripts/vtt2txt.ts",
    "mcp": "tsx mcp/index.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.30.0",
    "yaml": "^2.9.0",
    "zod": "^4.6.0"
  },
  "devDependencies": {
    "@types/node": "^25.0.0",
    "playwright": "^1.63.0",
    "tsx": "^4.23.0",
    "typescript": "^6.0.0",
    "vitest": "^5.0.0"
  }
}
```

- [ ] **Step 3: tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src", "scripts", "mcp", "test"]
}
```

- [ ] **Step 4: vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["test/**/*.test.ts"] },
});
```

- [ ] **Step 5: .gitignore에 추가**

기존 내용 아래에 붙인다.

```
.evidence/
node_modules/
```

(`.evidence/`가 이미 있으면 중복 추가하지 않는다.)

- [ ] **Step 6: smoke 테스트**

`test/smoke.test.ts`:

```ts
import { expect, it } from "vitest";

it("runs", () => {
  expect(1 + 1).toBe(2);
});
```

- [ ] **Step 7: 설치 후 실행**

```bash
npm install
npm test
npm run typecheck
```

Expected: `1 passed`, typecheck 출력 없음(성공).

- [ ] **Step 8: 커밋**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts test/smoke.test.ts .gitignore
git commit -m "chore: TypeScript · vitest · tsx 프로젝트 골격"
```

---

### Task 2: 스키마 [Opus]

**Files:**
- Create: `src/schema.ts`, `test/schema.test.ts`

**Interfaces:**
- Produces (모든 후속 태스크가 쓴다):
  - zod 스키마: `Stance` `Platform` `Size` `Direction` `Scope` `Measured` `Source` `Case` `Rule` `Option` `Quality` `Video` `SnapshotElement` `Snapshot`
  - 타입: `type Case = z.infer<typeof Case>` 등 같은 이름, `type Kg = { videos: Video[]; cases: Case[]; rules: Rule[]; options: Option[]; qualities: Quality[] }`
  - `Scope`의 모든 필드는 생략 시 `"any"`

- [ ] **Step 1: 실패하는 테스트**

`test/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Case, Quality, Rule, Scope, Snapshot } from "../src/schema.js";

describe("Scope", () => {
  it("defaults every field to any", () => {
    expect(Scope.parse({})).toEqual({
      component: "any", platform: "any", size: "any", variant: "any", context: "any",
    });
  });
});

describe("Case", () => {
  const base = {
    id: "case-001",
    source: { video: "dQw4w9WgXcQ", t: "04:12" },
    scope: { component: "button", platform: "mobile" },
    property: "touch-target",
    direction: "up",
    problem: "버튼이 너무 작다",
    fix: "높이를 44로",
    stance: "PRESCRIPTIVE",
    quote: "터치 영역은 무조건 44 이상 잡으셔야 돼요",
  };

  it("parses a minimal case and fills defaults", () => {
    const c = Case.parse(base);
    expect(c.scope.size).toBe("any");
    expect(c.qualities).toEqual([]);
    expect(c.rationale).toBe("");
  });

  it("rejects a bad id", () => {
    expect(() => Case.parse({ ...base, id: "c1" })).toThrow();
  });

  it("rejects a bad timestamp", () => {
    expect(() => Case.parse({ ...base, source: { video: "dQw4w9WgXcQ", t: "4분12초" } })).toThrow();
  });

  it("requires qualities in 현재→목표 form", () => {
    expect(Case.parse({ ...base, qualities: ["밋밋한→과감한"] }).qualities).toEqual(["밋밋한→과감한"]);
    expect(() => Case.parse({ ...base, qualities: ["과감한"] })).toThrow();
  });
});

describe("Rule", () => {
  const base = {
    id: "rule-001",
    statement: "모바일 터치 타겟은 최소 44px",
    grade: "CHECKABLE",
    scope: { platform: "mobile" },
    property: "touch-target",
    check: "Math.min(el.box.width, el.box.height) >= 44",
  };

  it("requires check when CHECKABLE", () => {
    expect(() => Rule.parse({ ...base, check: undefined })).toThrow();
    expect(Rule.parse({ ...base, grade: "JUDGMENT", check: undefined }).grade).toBe("JUDGMENT");
  });

  it("defaults source to corpus and state to default", () => {
    const r = Rule.parse(base);
    expect(r.source).toBe("corpus");
    expect(r.state).toBe("default");
    expect(r.conflicts_with).toEqual([]);
  });
});

describe("Quality", () => {
  it("parses realized_by with weight", () => {
    const q = Quality.parse({
      id: "quality-bold",
      label: "과감한",
      realized_by: [{ property: "type-scale", direction: "up", weight: 2, cases: ["case-001", "case-002"] }],
    });
    expect(q.aliases).toEqual([]);
    expect(q.realized_by[0].weight).toBe(2);
  });

  it("requires value when direction is set", () => {
    expect(() => Quality.parse({
      id: "quality-x", label: "x",
      realized_by: [{ property: "radius", direction: "set", weight: 1, cases: ["case-001"] }],
    })).toThrow();
  });
});

describe("Snapshot", () => {
  it("parses an element", () => {
    const s = Snapshot.parse({
      url: "file:///x.html", platform: "web", viewport: { width: 1280, height: 800 },
      capturedAt: "2026-09-10T00:00:00Z",
      elements: [{
        ui: "button", selector: '[data-snap-id="0"]', state: "default",
        box: { x: 0, y: 0, width: 120, height: 40 },
        style: { color: "rgb(0, 0, 0)" },
      }],
    });
    expect(s.elements[0].variant).toBe("any");
    expect(s.elements[0].context).toBe("any");
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../src/schema.js'`.

- [ ] **Step 3: 구현**

zod 4 주의: `.default(v)`는 `v`를 파싱하지 않고 그대로 돌려준다. 중첩 객체의 기본값을 채우려면 `.prefault(v)`를 써야 한다. 그래서 `Scope`는 전부 `.prefault({})`다.

`src/schema.ts`:

```ts
import { z } from "zod";

export const Stance = z.enum(["PRESCRIPTIVE", "PREFERRED", "OPTION"]);
export const Platform = z.enum(["mobile", "web", "any"]);
export const Size = z.enum(["sm", "md", "lg", "any"]);
export const Direction = z.enum(["up", "down", "set", "other"]);
export const ElementState = z.enum(["default", "focus-visible"]);

export const Scope = z.object({
  component: z.string().default("any"),
  platform: Platform.default("any"),
  size: Size.default("any"),
  variant: z.string().default("any"),
  context: z.string().default("any"),
});

export const Measured = z.object({
  prop: z.string(),
  value: z.number(),
  unit: z.string(),
});

export const Source = z.object({
  video: z.string().regex(/^[A-Za-z0-9_-]{11}$/, "YouTube video id"),
  t: z.string().regex(/^(\d{1,2}:)?\d{1,2}:\d{2}$/, "m:ss or h:mm:ss"),
});

export const Case = z.object({
  id: z.string().regex(/^case-\d{3,}$/),
  source: Source,
  scope: Scope.prefault({}),
  property: z.string(),
  direction: Direction.default("other"),
  problem: z.string(),
  fix: z.string(),
  rationale: z.string().default(""),
  stance: Stance,
  quote: z.string(),
  qualities: z.array(z.string().regex(/^[^→]+→[^→]+$/, "현재→목표")).default([]),
  measured: Measured.optional(),
  evidence: z.string().optional(),
});

export const Rule = z
  .object({
    id: z.string().regex(/^rule-\d{3,}$/),
    statement: z.string(),
    grade: z.enum(["CHECKABLE", "JUDGMENT"]),
    source: z.enum(["corpus", "standard"]).default("corpus"),
    standard_ref: z.string().optional(),
    scope: Scope.prefault({}),
    property: z.string(),
    state: ElementState.default("default"),
    check: z.string().optional(),
    promoted_from: z.array(z.string()).default([]),
    confidence: z.number().int().nonnegative().default(0),
    conflicts_with: z.array(z.string()).default([]),
  })
  .refine((r) => r.grade !== "CHECKABLE" || !!r.check, {
    message: "CHECKABLE rule needs a check expression",
    path: ["check"],
  });

export const Option = z.object({
  id: z.string().regex(/^option-\d{3,}$/),
  question: z.string(),
  scope: Scope.prefault({}),
  choices: z
    .array(
      z.object({
        label: z.string(),
        when: z.string(),
        recommended: z.boolean().default(false),
        cases: z.array(z.string()).min(1),
      }),
    )
    .min(2),
});

const RealizedBy = z
  .object({
    property: z.string(),
    direction: z.enum(["up", "down", "set"]),
    value: z.union([z.number(), z.string()]).optional(),
    scope: Scope.optional(),
    weight: z.number().int().positive(),
    cases: z.array(z.string()).min(1),
  })
  .refine((r) => r.direction !== "set" || r.value !== undefined, {
    message: "direction=set needs value",
    path: ["value"],
  });

export const Quality = z.object({
  id: z.string().regex(/^quality-[a-z0-9-]+$/),
  label: z.string(),
  aliases: z.array(z.string()).default([]),
  realized_by: z.array(RealizedBy).default([]),
  opposes: z.string().optional(),
});

export const Video = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  title: z.string(),
  url: z.url(),
  duration_s: z.number().int().positive().optional(),
  category: z.enum(["review", "web", "mobile"]),
  subtitles: z.enum(["auto", "manual", "none"]),
  reason: z.string(),
});

export const SnapshotElement = z.object({
  ui: z.string(),
  variant: z.string().default("any"),
  size: z.string().default("any"),
  context: z.string().default("any"),
  selector: z.string(),
  state: ElementState,
  box: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }),
  style: z.record(z.string(), z.string()),
  text: z.string().optional(),
});

export const Snapshot = z.object({
  url: z.string(),
  platform: Platform,
  viewport: z.object({ width: z.number(), height: z.number() }),
  capturedAt: z.string(),
  elements: z.array(SnapshotElement),
});

export type Stance = z.infer<typeof Stance>;
export type Platform = z.infer<typeof Platform>;
export type Scope = z.infer<typeof Scope>;
export type Case = z.infer<typeof Case>;
export type Rule = z.infer<typeof Rule>;
export type Option = z.infer<typeof Option>;
export type Quality = z.infer<typeof Quality>;
export type Video = z.infer<typeof Video>;
export type SnapshotElement = z.infer<typeof SnapshotElement>;
export type Snapshot = z.infer<typeof Snapshot>;

export type Kg = {
  videos: Video[];
  cases: Case[];
  rules: Rule[];
  options: Option[];
  qualities: Quality[];
};
```

- [ ] **Step 4: 통과 확인**

```bash
npm test && npm run typecheck
```

Expected: 모든 테스트 PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/schema.ts test/schema.test.ts
git commit -m "feat(schema): Case · Rule · Option · Quality · Video · Snapshot zod 스키마"
```

---

### Task 3: 로더 + validate CLI [Opus]

**Files:**
- Create: `src/load.ts`, `scripts/validate.ts`, `test/load.test.ts`, `test/fixtures/kg/videos.yaml`, `test/fixtures/kg/cases/dQw4w9WgXcQ.yaml`, `test/fixtures/kg/rules.yaml`, `test/fixtures/kg/options.yaml`, `test/fixtures/kg/qualities.yaml`, `kg/videos.yaml`, `kg/cases/.gitkeep`, `kg/rules.yaml`, `kg/options.yaml`, `kg/qualities.yaml`

**Interfaces:**
- Consumes: Task 2의 스키마와 `Kg` 타입
- Produces: `loadKg(dir: string): Kg` — 실패 시 `KgLoadError { file: string; issues: string[] }`를 던진다. `kg/cases/*.yaml`은 각 파일이 Case의 **리스트**다. 테스트 픽스처 `test/fixtures/kg/`는 T7 · T9 · T10 · T12가 그대로 재사용한다

- [ ] **Step 1: 픽스처 KG**

`test/fixtures/kg/videos.yaml`:

```yaml
- id: dQw4w9WgXcQ
  title: 픽스처 영상 A
  url: https://www.youtube.com/watch?v=dQw4w9WgXcQ
  category: review
  subtitles: auto
  reason: 테스트용
- id: aaaaaaaaaaa
  title: 픽스처 영상 B
  url: https://www.youtube.com/watch?v=aaaaaaaaaaa
  category: mobile
  subtitles: auto
  reason: 테스트용
- id: bbbbbbbbbbb
  title: 픽스처 영상 C
  url: https://www.youtube.com/watch?v=bbbbbbbbbbb
  category: web
  subtitles: auto
  reason: 테스트용
```

`test/fixtures/kg/cases/dQw4w9WgXcQ.yaml`:

```yaml
- id: case-001
  source: { video: dQw4w9WgXcQ, t: "04:12" }
  scope: { component: button, platform: mobile }
  property: touch-target
  direction: up
  problem: 버튼 높이가 32px라 손가락으로 누르기 어렵다
  fix: 높이를 44px로 키웠다
  rationale: 모바일 터치 영역 기준
  stance: PRESCRIPTIVE
  quote: 터치 영역은 무조건 44 이상 잡으셔야 돼요
  measured: { prop: touch-target, value: 44, unit: px }
- id: case-002
  source: { video: aaaaaaaaaaa, t: "01:30" }
  scope: { component: button, platform: mobile }
  property: touch-target
  direction: up
  problem: 아이콘 버튼이 너무 작다
  fix: 44로 키움
  stance: PRESCRIPTIVE
  quote: 이건 반드시 44는 돼야 해요
  measured: { prop: touch-target, value: 44, unit: px }
- id: case-003
  source: { video: bbbbbbbbbbb, t: "07:05" }
  scope: { component: button, platform: mobile }
  property: touch-target
  direction: up
  problem: 탭 영역 부족
  fix: 48로 키움
  stance: PRESCRIPTIVE
  quote: 터치 영역은 꼭 확보하셔야 됩니다
  measured: { prop: touch-target, value: 48, unit: px }
- id: case-004
  source: { video: dQw4w9WgXcQ, t: "09:40" }
  scope: { component: hero, platform: web, context: hero }
  property: type-scale
  direction: up
  problem: 히어로 타이틀이 본문과 크기 차이가 없어 밋밋하다
  fix: 타이틀을 64px로 키움
  stance: PREFERRED
  quote: 좀 더 과감하게 키우는 게 훨씬 낫죠
  qualities: [밋밋한→과감한]
- id: case-005
  source: { video: aaaaaaaaaaa, t: "03:15" }
  scope: { component: hero, platform: web, context: hero }
  property: type-scale
  direction: up
  problem: 첫 화면 임팩트가 약하다
  fix: 헤드라인 2배로
  stance: OPTION
  quote: 과감하게 가볼까요?
  qualities: [밋밋한→과감한]
- id: case-006
  source: { video: bbbbbbbbbbb, t: "02:00" }
  scope: { component: hero, platform: web, context: hero }
  property: type-scale
  direction: up
  problem: 헤드라인이 작다
  fix: 키움
  stance: PREFERRED
  quote: 과감한 느낌을 주려면 글자를 키우세요
  qualities: [밋밋한→과감한]
- id: case-007
  source: { video: dQw4w9WgXcQ, t: "12:00" }
  scope: { component: card }
  property: radius
  direction: set
  problem: 카드 모서리가 직각이라 딱딱하다
  fix: 8px 라운드
  stance: OPTION
  quote: 라운드를 주셔도 되고 취향이에요
  measured: { prop: radius, value: 8, unit: px }
```

`test/fixtures/kg/rules.yaml`:

```yaml
- id: rule-001
  statement: 모바일 터치 타겟은 최소 44px
  grade: CHECKABLE
  scope: { platform: mobile }
  property: touch-target
  check: "Math.min(el.box.width, el.box.height) >= 44"
  promoted_from: [case-001, case-002, case-003]
  confidence: 3
- id: rule-002
  statement: 텍스트와 배경의 대비는 4.5:1 이상
  grade: CHECKABLE
  source: standard
  standard_ref: WCAG 2.2 SC 1.4.3
  scope: {}
  property: contrast
  check: "contrast(el.style.color, el.style['background-color']) >= 4.5"
- id: rule-003
  statement: 히어로 타이틀은 본문과 위계가 한눈에 구분돼야 한다
  grade: JUDGMENT
  scope: { context: hero }
  property: hierarchy
  promoted_from: [case-004]
  confidence: 1
```

`test/fixtures/kg/options.yaml`:

```yaml
- id: option-001
  question: 카드 모서리 처리
  scope: { component: card }
  choices:
    - { label: 라운드 8px, when: 친근·모바일, recommended: true, cases: [case-007] }
    - { label: 직각, when: 정보 밀도·데스크톱, cases: [case-007] }
```

`test/fixtures/kg/qualities.yaml`:

```yaml
- id: quality-bold
  label: 과감한
  aliases: [대담한, 강한]
  realized_by:
    - { property: type-scale, direction: up, scope: { context: hero }, weight: 3, cases: [case-004, case-005, case-006] }
    - { property: whitespace, direction: up, weight: 1, cases: [case-004] }
  opposes: quality-subtle
- id: quality-subtle
  label: 차분한
  realized_by:
    - { property: type-scale, direction: down, weight: 1, cases: [case-004] }
  opposes: quality-bold
```

- [ ] **Step 2: 실패하는 테스트**

`test/load.test.ts`:

```ts
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
```

- [ ] **Step 3: 실패 확인**

```bash
npm test -- load
```

Expected: FAIL — `Cannot find module '../src/load.js'`.

- [ ] **Step 4: 구현**

`src/load.ts`:

```ts
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
```

`scripts/validate.ts`:

```ts
import { KgLoadError, loadKg } from "../src/load.js";

const dir = process.argv[2] ?? "kg";
try {
  const kg = loadKg(dir);
  const withQualities = kg.cases.filter((c) => c.qualities.length > 0).length;
  const withMeasured = kg.cases.filter((c) => c.measured).length;
  console.log(
    `ok: ${kg.videos.length} videos, ${kg.cases.length} cases ` +
      `(qualities ${withQualities}, measured ${withMeasured}), ` +
      `${kg.rules.length} rules, ${kg.options.length} options, ${kg.qualities.length} qualities`,
  );
} catch (e) {
  if (e instanceof KgLoadError) {
    console.error(`invalid: ${e.file}`);
    for (const issue of e.issues) console.error(`  - ${issue}`);
    process.exit(1);
  }
  throw e;
}
```

- [ ] **Step 5: 실제 `kg/` 초기 파일**

`kg/videos.yaml` · `kg/rules.yaml` · `kg/options.yaml` · `kg/qualities.yaml` 네 파일 모두 내용은 빈 리스트 한 줄:

```yaml
[]
```

`kg/cases/.gitkeep` 빈 파일.

- [ ] **Step 6: 통과 확인**

```bash
npm test && npm run typecheck
npm run validate
npm run validate test/fixtures/kg
```

Expected: 테스트 PASS. `npm run validate` → `ok: 0 videos, 0 cases (qualities 0, measured 0), 0 rules, 0 options, 0 qualities`. 픽스처 → `ok: 3 videos, 7 cases (qualities 3, measured 4), 3 rules, 1 options, 2 qualities`.

- [ ] **Step 7: 커밋 · PR**

```bash
git add src/load.ts scripts/validate.ts test/load.test.ts test/fixtures kg
git commit -m "feat(kg): YAML 로더 · 참조 무결성 검사 · validate CLI"
git push -u origin feat/kg-schema
gh pr create --title "feat(kg): 스키마 · 로더 · validate CLI" --body "T1~T3. 스키마(zod) · YAML 로더 · 참조 검사 · validate CLI. 픽스처 KG 포함."
```

PR 머지(squash)는 사용자가 한다. 머지 전에도 다음 브랜치는 이 브랜치에서 분기해 진행한다.

---

### Task 4: 코퍼스 선별 → `kg/videos.yaml` [Sonnet]

**Files:**
- Modify: `kg/videos.yaml`
- Create (로컬, 커밋 안 함): `.evidence/channel-list.tsv`

**Interfaces:**
- Consumes: `Video` 스키마 (Task 2), `npm run validate` (Task 3)
- Produces: 영상 20개 목록. 이후 Task 6이 `id` 순서대로 돈다

- [ ] **Step 1: 브랜치 · 툴 설치**

```bash
git checkout -b feat/corpus
brew install yt-dlp
yt-dlp --version
```

- [ ] **Step 2: 채널 영상 목록 받기**

```bash
mkdir -p .evidence
yt-dlp --flat-playlist --print "%(id)s\t%(title)s\t%(duration)s" \
  "https://www.youtube.com/@UXUIDesign/videos" > .evidence/channel-list.tsv
wc -l .evidence/channel-list.tsv
```

Expected: 1,000줄 안팎. 100줄 미만이면 `--flat-playlist`가 첫 페이지만 가져온 것이니 `--playlist-end 2000`을 붙여 다시 받는다.

- [ ] **Step 3: 1차 필터**

포함 키워드로 거르고 제외 키워드를 뺀다.

```bash
grep -iE "리뷰|피드백|포트폴리오|첨삭|개선|웹 ?디자인|모바일|앱 ?디자인|랜딩|UI" .evidence/channel-list.tsv \
  | grep -viE "포토샵|일러스트|photoshop|illustrator|XD|피그마 (기초|툴|단축키)|브이로그|Q&A|라이브" \
  > .evidence/candidates.tsv
wc -l .evidence/candidates.tsv
```

- [ ] **Step 4: 20개 고르기**

`.evidence/candidates.tsv`를 읽고 아래 기준으로 20개를 고른다. 판단이 필요하면 제목만으로 고르지 말고 `yt-dlp --skip-download --write-auto-sub --sub-lang ko --sub-format vtt -o ".evidence/%(id)s/%(id)s" <url>`로 자막을 받아 `npm run vtt2txt .evidence/<id>/<id>.ko.vtt | head -80`으로 앞부분을 훑는다(vtt2txt는 Task 5에서 만든다. Task 5를 먼저 끝내고 돌아와도 된다).

선별 기준 (스펙 3단계):
1. before/after가 있는 리뷰 영상을 12개 이상. 제목에 리뷰·피드백·포트폴리오·첨삭이 있는 것
2. 나머지는 웹/모바일 디자인 강의 중 화자가 형용사로 방향을 지시하는 것("밋밋하다", "고급스럽게", "과감하게", "정돈되게")
3. 길이 8~30분. 너무 짧으면 사례가 없고 너무 길면 추출 단가가 높다
4. 자막 있는 것만. `yt-dlp --list-subs <url>`에 `ko` 자동자막이라도 있어야 한다
5. 툴 조작법 영상 제외

- [ ] **Step 5: videos.yaml 작성**

각 항목 형식:

```yaml
- id: <11자 영상 ID>
  title: <원제목 그대로>
  url: https://www.youtube.com/watch?v=<id>
  duration_s: <초>
  category: review        # review | web | mobile
  subtitles: auto         # auto | manual | none
  reason: <왜 골랐나 한 줄. 예: "앱 온보딩 리뷰, before/after 명시, 여백·위계 지적 다수">
```

- [ ] **Step 6: 검증**

```bash
npm run validate
```

Expected: `ok: 20 videos, ...`. `category: review`가 12개 이상인지 `grep -c "category: review" kg/videos.yaml`로 확인.

- [ ] **Step 7: 커밋**

```bash
git add kg/videos.yaml
git commit -m "feat(corpus): 영상 20개 선별 목록"
```

---

### Task 5: 추출 도구 — vtt2txt · 추출 가이드 [Sonnet]

**Files:**
- Create: `scripts/vtt2txt.ts`, `test/vtt2txt.test.ts`, `test/fixtures/sample.vtt`, `docs/extraction-guide.md`

**Interfaces:**
- Produces: `parseVtt(text: string): Array<{ t: string; text: string }>` (`scripts/vtt2txt.ts`에서 export), CLI `npm run vtt2txt <file.vtt>` → stdout에 `[m:ss] 텍스트` 한 줄씩. Task 6이 매 영상마다 쓴다

- [ ] **Step 1: 픽스처 자막**

`test/fixtures/sample.vtt` (유튜브 자동자막은 같은 줄이 겹쳐 반복된다. 그 모양을 그대로 흉내 낸다):

```
WEBVTT
Kind: captions
Language: ko

00:00:01.000 --> 00:00:03.500 align:start position:0%
 
여기<00:00:01.500><c> 보시면</c><00:00:02.000><c> 버튼이</c>

00:00:03.500 --> 00:00:03.510 align:start position:0%
여기 보시면 버튼이
 

00:00:03.510 --> 00:00:06.000 align:start position:0%
여기 보시면 버튼이
너무<00:00:04.000><c> 작죠</c>

00:00:06.000 --> 00:00:06.010 align:start position:0%
너무 작죠
 

00:04:12.000 --> 00:04:15.000 align:start position:0%
터치<00:04:12.500><c> 영역은</c><00:04:13.000><c> 무조건</c><00:04:13.500><c> 44</c><00:04:14.000><c> 이상</c>
```

- [ ] **Step 2: 실패하는 테스트**

`test/vtt2txt.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseVtt } from "../scripts/vtt2txt.js";

describe("parseVtt", () => {
  it("strips tags, dedupes repeated lines, keeps m:ss", () => {
    const vtt = readFileSync(new URL("./fixtures/sample.vtt", import.meta.url), "utf8");
    expect(parseVtt(vtt)).toEqual([
      { t: "0:01", text: "여기 보시면 버튼이" },
      { t: "0:03", text: "너무 작죠" },
      { t: "4:12", text: "터치 영역은 무조건 44 이상" },
    ]);
  });

  it("formats hours when present", () => {
    expect(parseVtt("WEBVTT\n\n01:02:03.000 --> 01:02:04.000\n안녕\n")).toEqual([
      { t: "1:02:03", text: "안녕" },
    ]);
  });
});
```

- [ ] **Step 3: 실패 확인**

```bash
npm test -- vtt2txt
```

Expected: FAIL — module not found.

- [ ] **Step 4: 구현**

`scripts/vtt2txt.ts`:

```ts
import { readFileSync } from "node:fs";

export type Cue = { t: string; text: string };

function formatTime(stamp: string): string {
  const [h, m, s] = stamp.split(":").map((p) => Number.parseInt(p, 10));
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

export function parseVtt(vtt: string): Cue[] {
  const cues: Cue[] = [];
  const blocks = vtt.replace(/\r/g, "").split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split("\n");
    const idx = lines.findIndex((l) => l.includes("-->"));
    if (idx < 0) continue;
    const start = lines[idx].split("-->")[0].trim().split(".")[0];
    const lastText = cues[cues.length - 1]?.text;
    // 유튜브 자동자막은 블록마다 직전 줄을 한 번 더 싣는다. 그 줄을 빼고 남은 것만 새 cue다.
    const fresh = lines
      .slice(idx + 1)
      .map((l) => l.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
      .filter((l) => l.length > 0 && l !== lastText)
      .join(" ")
      .trim();
    if (!fresh || fresh === lastText) continue;
    cues.push({ t: formatTime(start), text: fresh });
  }
  return cues;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/^.*\//, ""))) {
  const file = process.argv[2];
  if (!file) {
    console.error("usage: npm run vtt2txt <file.vtt>");
    process.exit(1);
  }
  for (const c of parseVtt(readFileSync(file, "utf8"))) console.log(`[${c.t}] ${c.text}`);
}
```

- [ ] **Step 5: 통과 확인**

```bash
npm test -- vtt2txt && npm run vtt2txt test/fixtures/sample.vtt
```

Expected: PASS. CLI 출력 3줄, 첫 줄 `[0:01] 여기 보시면 버튼이`. 테스트가 깨지면 픽스처 기대값이 아니라 `parseVtt`를 고친다. 기대값이 스펙이다.

- [ ] **Step 6: 추출 가이드 작성**

`docs/extraction-guide.md` — 아래 내용 그대로.

````markdown
# Case 추출 가이드

영상 하나를 Case 여러 개로 바꾸는 절차. Task 6이 영상 20개에 이 절차를 반복한다.
추출은 LLM(실행 에이전트)이 초안을 만들고 사람이 검수한다. 자동화 툴을 만들지 않는다.

## 0. 준비

```bash
ID=<영상 ID>
URL="https://www.youtube.com/watch?v=$ID"
mkdir -p .evidence/$ID
```

## 1. 자막

```bash
yt-dlp --skip-download --write-auto-sub --write-sub --sub-lang ko --sub-format vtt \
  -o ".evidence/%(id)s/%(id)s" "$URL"
ls .evidence/$ID/          # <id>.ko.vtt 가 있어야 한다
npm run vtt2txt .evidence/$ID/$ID.ko.vtt > .evidence/$ID/transcript.txt
wc -l .evidence/$ID/transcript.txt
```

자막이 없으면(`ls`에 vtt가 없음) 이 영상은 건너뛰고 `kg/videos.yaml`의 `subtitles: none`으로 고친 뒤 Task 4의 후보 목록에서 대체 영상을 하나 고른다.

## 2. 영상 (프레임 캡처용)

```bash
yt-dlp -f "bv*[height<=720][ext=mp4]/bv*[height<=720]" -o ".evidence/%(id)s/%(id)s.%(ext)s" "$URL"
```

## 3. 지적 지점 찾기

`transcript.txt`를 처음부터 끝까지 읽는다. 다음 신호가 있는 줄을 후보로 표시한다.

| 신호 | 예 |
|---|---|
| 문제 지적 | "여기가 좀 아쉬워요", "이건 잘못됐어요", "답답해 보이죠" |
| 수정 지시 | "이렇게 바꾸면", "키우세요", "여백을 더" |
| 수치 | "44", "8픽셀", "1.5배", "16 정도" |
| 형용사 방향 | "밋밋한데 과감하게", "고급스럽게", "정돈되게", "무거워 보이니 가볍게" |
| 어조 단서 | "무조건", "반드시", "절대" / "~하는 게 좋아요", "낫죠" / "~해볼까요", "취향" |

한 영상에 보통 5~15개가 나온다. 지적 하나 = Case 하나. 같은 지적을 반복해서 말하면 첫 지점 하나만.

## 4. 프레임 캡처

후보마다 화자가 문제를 가리키는 시점(`t`)의 프레임을 뽑는다. before와 after가 다른 시점이면 둘 다.

```bash
T=04:12
ffmpeg -loglevel error -ss 00:$T -i .evidence/$ID/$ID.mp4 -frames:v 1 -y .evidence/$ID/$(echo $T | tr -d :).png
```

프레임을 Read 툴로 열어 본다. 자막이 "여기를 이렇게"라고만 말하는 경우 프레임이 있어야 `problem` · `fix`를 쓸 수 있다.

## 5. Case 초안

`kg/cases/<ID>.yaml`에 리스트로 쓴다. ID는 전역 일련번호다. 기존 최댓값 다음 번호부터 쓴다:

```bash
grep -rho "case-[0-9]*" kg/cases | sort -t- -k2 -n | tail -1
```

각 항목:

```yaml
- id: case-NNN
  source: { video: <ID>, t: "m:ss" }
  scope:
    component: button      # button | input | card | list | nav | hero | form | modal | typo | color | layout | icon | image | any
    platform: mobile       # mobile | web | any
    size: any              # sm | md | lg | any
    variant: any           # primary | secondary | ghost | outline | any
    context: any           # list | hero | form | modal | nav | any
  property: touch-target   # spacing | size | color | contrast | hierarchy | touch-target | radius | shadow | motion | type-scale | line-height | alignment | density | whitespace | saturation | weight
  direction: up            # up | down | set | other   — 화자가 값을 키우라/줄이라/특정값으로/구조 변경
  problem: <무엇이 문제였나. 프레임에서 본 것>
  fix: <어떻게 고쳤나 / 고치라고 했나>
  rationale: <왜. 화자가 말한 이유. 없으면 빈 문자열>
  stance: PRESCRIPTIVE     # PRESCRIPTIVE | PREFERRED | OPTION
  quote: <어조 판정 근거가 된 문장 그대로>
  qualities: [밋밋한→과감한]   # 화자가 쓴 형용사. 현재→목표. 없으면 []
  measured: { prop: touch-target, value: 44, unit: px }   # 수치 언급 시에만
  evidence: .evidence/<ID>/0412.png
```

stance 판정 규칙:

| stance | 어미 |
|---|---|
| PRESCRIPTIVE | ~해야 됩니다 · ~하면 안 돼요 · 무조건 · 반드시 · 절대 · 필수 |
| PREFERRED | ~하는 게 좋아요 · 훨씬 낫죠 · 추천드려요 · ~하면 더 |
| OPTION | ~해볼까요 · ~해도 되고 · 취향이에요 · 이럴 수도 있고 · 상황에 따라 |

`quote`에 어미가 그대로 들어 있어야 한다. 헷갈리면 낮은 쪽(OPTION)으로 둔다. 규칙이 되기보다 선택지로 남는 게 안전하다.

`qualities`는 화자가 실제로 쓴 형용사만. "과감하게"라고 안 했는데 추출자가 그렇게 느꼈다고 적지 않는다. 현재 상태 형용사를 안 말했으면 `?→과감한`처럼 `?`를 쓴다.

`direction`: `measured`가 있고 화자가 "이 값으로"라고 했으면 `set`. "키워라/줄여라"면 `up/down`. 구조·배치 변경이면 `other`.

## 6. 검수 체크리스트

파일을 저장하기 전에 항목마다 확인한다.

- [ ] `t`가 transcript의 해당 줄과 ±5초 안에 있다
- [ ] `quote`가 transcript에 실제로 있는 문장이다 (요약 금지)
- [ ] `problem`은 프레임에서 확인한 것이다. 자막만으로 추정하지 않았다
- [ ] `stance`의 근거 어미가 `quote`에 있다
- [ ] `measured`가 있으면 `quote`에 그 숫자가 있다
- [ ] `qualities`의 형용사가 `quote` 또는 인접 자막에 있다
- [ ] `scope.component`가 목록의 값이다. 모르면 `any`

```bash
npm run validate
```

통과하면 커밋한다. 커밋에 `.evidence/`가 딸려 오지 않았는지 `git status`로 본다.

## 7. 커밋

```bash
git add kg/cases/$ID.yaml
git commit -m "feat(corpus): $ID Case N개 추출"
```
````

- [ ] **Step 7: 커밋**

```bash
git add scripts/vtt2txt.ts test/vtt2txt.test.ts test/fixtures/sample.vtt docs/extraction-guide.md
git commit -m "feat(corpus): vtt2txt 변환기 · Case 추출 가이드"
```

---

### Task 6: 영상 20개 → Case 추출 [Sonnet]

**Files:**
- Create: `kg/cases/<videoId>.yaml` × 20
- Modify: `kg/videos.yaml` (자막 없는 영상 교체 시)

**Interfaces:**
- Consumes: `docs/extraction-guide.md` (Task 5), `kg/videos.yaml` (Task 4), `npm run validate`
- Produces: Case 전체. Task 7 · 8이 읽는다

- [ ] **Step 1: 영상 1개로 절차 시험**

`kg/videos.yaml`의 첫 항목에 `docs/extraction-guide.md` 0~7절을 그대로 적용한다. 끝나면 사용자에게 결과 파일을 보여주고 검수받는다. 여기서 스키마나 가이드가 어긋나면 Task 2 · 5로 돌아가 고친 뒤 계속한다. **이 첫 영상이 파일럿이다. 20개를 돌린 뒤 스키마를 고치면 재작업 비용이 크다.**

- [ ] **Step 2: 나머지 19개**

`kg/videos.yaml` 순서대로. 영상마다 가이드 0~7절을 반복하고 영상마다 커밋한다. 5개마다 `npm run validate` 출력을 사용자에게 보고한다(누적 Case 수 · qualities 있는 수 · measured 있는 수).

- [ ] **Step 3: 마무리 검증**

```bash
npm run validate
grep -c "^- id:" kg/cases/*.yaml
```

Expected: 20개 파일, 총 Case 100개 이상, `qualities` 비어 있지 않은 비율 30% 이상, `measured` 있는 Case 15개 이상. 미달이면 어느 영상이 빈약했는지 보고하고 Task 4 후보 목록에서 대체 영상을 최대 3개까지 추가한다.

- [ ] **Step 4: PR**

```bash
git push -u origin feat/corpus
gh pr create --title "feat(corpus): 영상 20개 선별 · Case 추출" --body "T4~T6. videos.yaml 20개, cases/*.yaml. validate 결과: <붙여넣기>"
```

---

### Task 6c: 컴포넌트 매핑 + 커버리지 스크립트 [Opus]

**Files:**
- Create: `kg/components.yaml`, `src/coverage.ts`, `scripts/coverage.ts`, `test/coverage.test.ts`, `test/fixtures/kg/components.yaml`
- Modify: `package.json` (`"coverage": "tsx scripts/coverage.ts"`), `docs/extraction-guide.md` (§5 `scope.component` 목록 확장), `src/load.ts` (components 로딩)

**Interfaces:**
- Consumes: `Kg`, `loadKg`, Case/Rule/Option/Quality 타입
- Produces:
  ```ts
  // schema.ts 추가
  const ComponentMap = z.object({ kg: z.string(), ui: z.array(z.string()), exclude: z.boolean().default(false), note: z.string().optional() });
  // Kg 확장: components: ComponentMap[]   (kg/components.yaml, 없으면 [])
  type Coverage = {
    rows: Array<{ kg: string; ui: string[]; cases: number; videos: number; promoted: boolean }>;
    caseCoverage: number;      // 0~1. exclude 아닌 ui 컴포넌트 중 cases ≥ 1 인 kg에 속한 것의 비율
    promotedCoverage: number;  // 0~1. 같은 분모, promoted인 kg에 속한 것의 비율
    uncovered: string[];       // ui 이름. 가장 비어 있는 것부터
  };
  function coverage(kg: Kg): Coverage;
  ```
  CLI `npm run coverage [dir]` → 표 + `case coverage: 61% (33/54)` · `promoted coverage: 20% (11/54)` · `uncovered: Table, Tabs, …` 세 줄

- [ ] **Step 1: `kg/components.yaml`** — my-ui-lib 컴포넌트 54개를 KG component 어휘로 묶는다. KG 어휘는 기존 13개에 `select · checkbox · table · tabs · accordion · tooltip · badge · avatar · chart · progress · toast · popover · separator`를 더한다.

```yaml
- { kg: button,    ui: [Button, Toggle, ToggleGroup] }
- { kg: input,     ui: [Input, Textarea, NumberField, OtpField, Autocomplete, Combobox, Label, Fieldset] }
- { kg: select,    ui: [Select, DropdownMenu, ContextMenu, Menubar] }
- { kg: checkbox,  ui: [Checkbox, CheckboxGroup, RadioGroup, Switch] }
- { kg: card,      ui: [Card, StatCard, PreviewCard] }
- { kg: list,      ui: [ScrollArea] }
- { kg: table,     ui: [Table, DataTable] }
- { kg: nav,       ui: [Header, Sidebar, NavigationMenu, Toolbar] }
- { kg: modal,     ui: [Dialog, AlertDialog, Drawer] }
- { kg: popover,   ui: [Popover] }
- { kg: tooltip,   ui: [Tooltip] }
- { kg: tabs,      ui: [Tabs] }
- { kg: accordion, ui: [Accordion, Collapsible] }
- { kg: badge,     ui: [Badge, Tag] }
- { kg: avatar,    ui: [Avatar] }
- { kg: progress,  ui: [Progress, Meter, Slider] }
- { kg: toast,     ui: [Toaster] }
- { kg: form,      ui: [Form] }
- { kg: chart,     ui: [PieChart] }
- { kg: separator, ui: [Separator] }
- { kg: icon,      ui: [Icon] }
- { kg: hero,      ui: [] }
- { kg: typo,      ui: [] }
- { kg: color,     ui: [] }
- { kg: layout,    ui: [] }
- { kg: image,     ui: [] }
- { kg: structure, ui: [] }
- { kg: excluded,  ui: [ActiveStrategyCard, StrategyNode, NodePalette, PropertyPanel, StockChart, CodeBlock], exclude: true, note: "kis-trader 도메인 전용. 디자인 채널이 다룰 리 없음" }
```

`hero · typo · color · layout · image · structure`는 ui가 비어 있어도 둔다 — Case의 component 값으로 쓰이지만 분모에는 안 들어간다. 분모 = `exclude: false`인 행의 `ui` 합집합 = 48개.

- [ ] **Step 2: 실패하는 테스트** — `test/fixtures/kg/components.yaml`에 위 매핑 중 4행(button · card · table · excluded)만 넣고, 픽스처 Case(button ×3, hero ×3, card ×1)로:

```ts
import { describe, expect, it } from "vitest";
import { coverage } from "../src/coverage.js";
import { loadKg } from "../src/load.js";

const kg = loadKg(new URL("./fixtures/kg", import.meta.url).pathname);

describe("coverage", () => {
  it("counts cases and videos per kg component", () => {
    const c = coverage(kg);
    const button = c.rows.find((r) => r.kg === "button")!;
    expect(button).toMatchObject({ cases: 3, videos: 3, promoted: true });   // rule-001 scope any component? → 아래 참고
    expect(c.rows.find((r) => r.kg === "table")).toMatchObject({ cases: 0, videos: 0, promoted: false });
  });
  it("computes coverage over non-excluded ui components", () => {
    const c = coverage(kg);
    // 분모: Button Toggle ToggleGroup Card StatCard PreviewCard Table DataTable = 8
    // cases≥1: button(3 ui) + card(3 ui) = 6 → 0.75
    expect(c.caseCoverage).toBeCloseTo(6 / 8);
    expect(c.uncovered).toEqual(["Table", "DataTable"]);
  });
  it("marks promoted when a rule/option/quality scope names the component", () => {
    const c = coverage(kg);
    expect(c.rows.find((r) => r.kg === "card")!.promoted).toBe(true);     // option-001 scope card
    expect(c.rows.find((r) => r.kg === "button")!.promoted).toBe(false);  // rule-001 scope component any → 명시 아님
    expect(c.promotedCoverage).toBeCloseTo(3 / 8);
  });
});
```

첫 테스트의 `promoted: true` 주석은 틀렸다 — 세 번째 테스트가 맞다(`rule-001`은 `component: any`라 명시가 아님). 첫 테스트를 `promoted: false`로 쓴다. `scope.component === "any"`는 promoted로 세지 않는다.

- [ ] **Step 3: 구현**

`src/coverage.ts`:

```ts
import type { Kg } from "./schema.js";

export type CoverageRow = { kg: string; ui: string[]; cases: number; videos: number; promoted: boolean };
export type Coverage = { rows: CoverageRow[]; caseCoverage: number; promotedCoverage: number; uncovered: string[] };

export function coverage(kg: Kg): Coverage {
  const promotedKg = new Set<string>();
  for (const r of kg.rules) if (r.scope.component !== "any") promotedKg.add(r.scope.component);
  for (const o of kg.options) if (o.scope.component !== "any") promotedKg.add(o.scope.component);
  for (const q of kg.qualities)
    for (const rb of q.realized_by) if (rb.scope && rb.scope.component !== "any") promotedKg.add(rb.scope.component);

  const rows: CoverageRow[] = kg.components
    .filter((m) => !m.exclude)
    .map((m) => {
      const cases = kg.cases.filter((c) => c.scope.component === m.kg);
      return {
        kg: m.kg, ui: m.ui, cases: cases.length,
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
```

`scripts/coverage.ts`:

```ts
import { coverage } from "../src/coverage.js";
import { loadKg } from "../src/load.js";

const kg = loadKg(process.argv[2] ?? "kg");
const c = coverage(kg);
console.log("| kg | ui | cases | videos | promoted |\n|---|---|---|---|---|");
for (const r of c.rows) console.log(`| ${r.kg} | ${r.ui.join(" ") || "-"} | ${r.cases} | ${r.videos} | ${r.promoted ? "yes" : "-"} |`);
const denom = c.rows.flatMap((r) => r.ui).length;
console.log(`\ncase coverage: ${Math.round(c.caseCoverage * 100)}% (${Math.round(c.caseCoverage * denom)}/${denom})`);
console.log(`promoted coverage: ${Math.round(c.promotedCoverage * 100)}% (${Math.round(c.promotedCoverage * denom)}/${denom})`);
console.log(`uncovered: ${c.uncovered.join(", ") || "-"}`);
```

`src/schema.ts`에 `ComponentMap` 추가, `Kg`에 `components: ComponentMap[]`. `src/load.ts`의 `loadKg`가 `components.yaml`을 `parseList`로 읽는다(없으면 `[]`). 기존 테스트가 `Kg` 형태 변경으로 깨지면 그 테스트의 기대 객체에 `components`를 더한다.

`docs/extraction-guide.md` §5의 `scope.component` 주석 목록을 `kg/components.yaml`의 `kg` 값 전체로 바꾼다(excluded 제외).

- [ ] **Step 4: 통과 확인 · 커밋**

```bash
npm test && npm run typecheck && npm run coverage
git add kg/components.yaml src/coverage.ts src/schema.ts src/load.ts scripts/coverage.ts test/coverage.test.ts test/fixtures/kg/components.yaml package.json docs/extraction-guide.md
git commit -m "feat(coverage): my-ui-lib 컴포넌트 매핑 · 커버리지 스크립트"
```

---

### Task 6d: 커버리지 목표까지 5편씩 증분 추출 [Sonnet]

**Files:**
- Modify: `kg/videos.yaml` (+5씩), `kg/cases/<id>.yaml` (신규)

**Interfaces:**
- Consumes: `npm run coverage`, `docs/extraction-guide.md`, `.evidence/channel-list.tsv` (Task 4)
- Produces: 목표를 만족하는 코퍼스. Task 7~8이 이 위에서 돈다

**목표**: case coverage ≥ 70%, promoted coverage는 Task 8 뒤에 잰다(여기서는 case coverage만). 상한 40편. 한 번의 +5가 case coverage를 5%p 미만으로 올리면 멈추고 남은 uncovered는 "이 채널이 안 다루는 컴포넌트"로 보고한다.

- [ ] **Step 1: 측정** — `npm run coverage` → `uncovered` 목록을 본다.
- [ ] **Step 2: 5편 고르기** — uncovered 컴포넌트를 겨냥한다. `.evidence/channel-list.tsv`에서 제목 검색(예: 테이블·표·리스트 → table, 탭 → tabs, 드롭다운·셀렉트 → select, 팝업·모달·바텀시트 → modal, 토스트·알림 → toast, 차트·그래프·대시보드 → chart, 프로필·아바타 → avatar, 태그·뱃지·라벨 → badge, 아코디언·펼침 → accordion, 툴팁 → tooltip). 제목으로 안 잡히면 `yt-dlp "ytsearch10:<키워드> site:youtube.com/@UXUIDesign"`은 안 되므로, 후보 영상의 자막을 받아 `grep -c` 로 키워드 빈도를 세서 고른다. Task 4의 기준(8~30분, 한국어 자막, 툴 강좌 제외)은 그대로.
- [ ] **Step 3: 추가 · 추출** — `kg/videos.yaml`에 5편 append (`reason`에 겨냥한 컴포넌트를 적는다). 각 영상은 가이드 §0~§7. Case id 블록은 videos.yaml의 index(21 → `case-2101…`).
- [ ] **Step 4: 재측정** — `npm run coverage`. 목표 도달 · 상한 도달 · 증분 < 5%p 중 하나면 종료, 아니면 Step 1로.
- [ ] **Step 5: 보고 · 커밋** — 라운드마다 커밋 `feat(corpus): +5편 (round N) — <겨냥 컴포넌트>`. 최종 coverage 표를 `docs/coverage.md`에 남긴다.

---

### Task 7: 승격 후보 계산 [Opus]

**Files:**
- Create: `src/candidates.ts`, `scripts/candidates.ts`, `test/candidates.test.ts`

**Interfaces:**
- Consumes: `Case` 타입, `loadKg`, `test/fixtures/kg`
- Produces:
  ```ts
  type RuleCandidate = {
    key: string;                         // `${component}|${property}|${direction}`
    component: string; property: string; direction: string;
    videos: string[];                    // 서로 다른 영상 ID
    cases: string[];
    stance: { PRESCRIPTIVE: number; PREFERRED: number; OPTION: number };
    destination: "Rule" | "Option";
    measured: { values: number[]; unit: string | null; agree: boolean };
    grade: "CHECKABLE" | "JUDGMENT" | null;   // destination이 Rule일 때만
  };
  type QualityCandidate = {
    target: string;                      // → 뒤의 형용사
    property: string; direction: string;
    videos: string[]; cases: string[]; weight: number;
  };
  function ruleCandidates(cases: Case[], minVideos?: number): RuleCandidate[];
  function qualityCandidates(cases: Case[], minVideos?: number): QualityCandidate[];
  ```
  `minVideos` 기본 3. Task 8이 CLI 출력을 보고 사람이 확정한다

- [ ] **Step 1: 실패하는 테스트**

`test/candidates.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { qualityCandidates, ruleCandidates } from "../src/candidates.js";
import { loadKg } from "../src/load.js";

const kg = loadKg(new URL("./fixtures/kg", import.meta.url).pathname);

describe("ruleCandidates", () => {
  it("groups by component|property|direction across distinct videos", () => {
    const c = ruleCandidates(kg.cases);
    const touch = c.find((x) => x.key === "button|touch-target|up");
    expect(touch).toBeDefined();
    expect(touch!.videos).toHaveLength(3);
    expect(touch!.cases).toEqual(["case-001", "case-002", "case-003"]);
  });

  it("sends PRESCRIPTIVE majority to Rule with CHECKABLE when measured values agree", () => {
    const touch = ruleCandidates(kg.cases).find((x) => x.key === "button|touch-target|up")!;
    expect(touch.stance).toEqual({ PRESCRIPTIVE: 3, PREFERRED: 0, OPTION: 0 });
    expect(touch.destination).toBe("Rule");
    expect(touch.measured).toEqual({ values: [44, 44, 48], unit: "px", agree: true });
    expect(touch.grade).toBe("CHECKABLE");
  });

  it("sends non-PRESCRIPTIVE majority to Option", () => {
    const hero = ruleCandidates(kg.cases).find((x) => x.key === "hero|type-scale|up")!;
    expect(hero.destination).toBe("Option");
    expect(hero.grade).toBeNull();
  });

  it("drops groups under minVideos", () => {
    expect(ruleCandidates(kg.cases).find((x) => x.key === "card|radius|set")).toBeUndefined();
    expect(ruleCandidates(kg.cases, 1).find((x) => x.key === "card|radius|set")).toBeDefined();
  });

  it("treats a tie as Option", () => {
    const tie = kg.cases
      .filter((c) => c.property === "touch-target")
      .map((c, i) => ({ ...c, stance: i === 0 ? "PRESCRIPTIVE" : "OPTION" as const }));
    // 1 PRESCRIPTIVE vs 2 OPTION → Option; 2 vs 1 은 Rule
    expect(ruleCandidates(tie)[0].destination).toBe("Option");
    const two = tie.map((c, i) => ({ ...c, stance: i < 2 ? "PRESCRIPTIVE" as const : "OPTION" as const }));
    expect(ruleCandidates(two)[0].destination).toBe("Rule");
  });

  it("marks measured disagreement as JUDGMENT", () => {
    const spread = kg.cases
      .filter((c) => c.property === "touch-target")
      .map((c, i) => ({ ...c, measured: { prop: "touch-target", value: [44, 60, 30][i], unit: "px" } }));
    const r = ruleCandidates(spread)[0];
    expect(r.measured.agree).toBe(false);
    expect(r.grade).toBe("JUDGMENT");
  });
});

describe("qualityCandidates", () => {
  it("groups by target adjective|property|direction", () => {
    const q = qualityCandidates(kg.cases);
    expect(q).toEqual([
      { target: "과감한", property: "type-scale", direction: "up", videos: ["dQw4w9WgXcQ", "aaaaaaaaaaa", "bbbbbbbbbbb"], cases: ["case-004", "case-005", "case-006"], weight: 3 },
    ]);
  });

  it("ignores stance entirely", () => {
    const all = kg.cases.map((c) => ({ ...c, stance: "OPTION" as const }));
    expect(qualityCandidates(all)).toHaveLength(1);
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
npm test -- candidates
```

Expected: FAIL — module not found.

- [ ] **Step 3: 구현**

`src/candidates.ts`:

```ts
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
  target: string;
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
  type Row = { target: string; case: Case };
  const rows: Row[] = cases.flatMap((c) =>
    c.qualities.map((q) => ({ target: q.split("→")[1].trim(), case: c })),
  );
  const out: QualityCandidate[] = [];
  const groups = groupBy(rows, (r) => `${r.target}|${r.case.property}|${r.case.direction}`);
  for (const [key, group] of groups) {
    const videos = uniq(group.map((r) => r.case.source.video));
    if (videos.length < minVideos) continue;
    const [target, property, direction] = key.split("|");
    out.push({
      target, property, direction, videos,
      cases: group.map((r) => r.case.id),
      weight: group.length,
    });
  }
  return out.sort((a, b) => b.weight - a.weight || a.target.localeCompare(b.target));
}
```

`scripts/candidates.ts`:

```ts
import { qualityCandidates, ruleCandidates } from "../src/candidates.js";
import { loadKg } from "../src/load.js";

const dir = process.argv[2] ?? "kg";
const min = Number(process.argv[3] ?? 3);
const kg = loadKg(dir);

console.log(`# Rule / Option 후보 (영상 ${min}개 이상)\n`);
console.log("| key | videos | P/Pf/O | → | measured | grade | cases |");
console.log("|---|---|---|---|---|---|---|");
for (const c of ruleCandidates(kg.cases, min)) {
  const m = c.measured.values.length
    ? `${c.measured.values.join(",")}${c.measured.unit ?? ""} ${c.measured.agree ? "일치" : "불일치"}`
    : "-";
  console.log(
    `| ${c.key} | ${c.videos.length} | ${c.stance.PRESCRIPTIVE}/${c.stance.PREFERRED}/${c.stance.OPTION} | ${c.destination} | ${m} | ${c.grade ?? "-"} | ${c.cases.join(" ")} |`,
  );
}

console.log(`\n# Quality 후보 (영상 ${min}개 이상)\n`);
console.log("| 형용사 | property | direction | videos | weight | cases |");
console.log("|---|---|---|---|---|---|");
for (const q of qualityCandidates(kg.cases, min)) {
  console.log(`| ${q.target} | ${q.property} | ${q.direction} | ${q.videos.length} | ${q.weight} | ${q.cases.join(" ")} |`);
}
```

- [ ] **Step 4: 통과 확인**

```bash
npm test -- candidates && npm run typecheck
npm run candidates test/fixtures/kg
```

Expected: PASS. CLI가 Rule 표 2행(`button|touch-target|up` Rule CHECKABLE, `hero|type-scale|up` Option), Quality 표 1행(`과감한 type-scale up`).

- [ ] **Step 5: 커밋**

```bash
git checkout -b feat/promotion
git add src/candidates.ts scripts/candidates.ts test/candidates.test.ts
git commit -m "feat(promotion): 승격 후보 계산 · candidates CLI"
```

---

### Task 8: 승격 실행 → rules · options · qualities · schema.md [Sonnet]

**Files:**
- Modify: `kg/rules.yaml`, `kg/options.yaml`, `kg/qualities.yaml`
- Create: `kg/promotion-log.md`, `docs/schema.md`

**Interfaces:**
- Consumes: `npm run candidates` (Task 7), `docs/plan.md`의 승격 게이트 절
- Produces: Task 9~12가 읽는 실제 그래프. 통과 조건은 Global Constraints의 "Quality 5개 이상, 각각 realized_by 2개 이상"

- [ ] **Step 1: 후보 표 뽑기**

```bash
npm run candidates > .evidence/candidates.md
npm run candidates kg 2 > .evidence/candidates-min2.md
```

두 파일을 사용자에게 보여준다. 3개 미만 그룹(min2 표)은 승격 안 되지만 "아깝게 못 넘은 것"을 보는 용도다.

- [ ] **Step 2: Rule / Option 확정 (사람과 함께)**

후보 표의 각 행을 사용자와 하나씩 본다. 행마다 결정은 세 가지 중 하나: 승격 · 강등(Rule 후보를 Option으로) · 보류. 아래 규칙을 적용하고, 결정과 이유를 `kg/promotion-log.md`에 적는다.

1. `destination: Rule`, `grade: CHECKABLE` → `rules.yaml`에 추가. `check` 식은 아래 표에서 고른다. 표에 없는 property는 JUDGMENT로 내린다
2. `destination: Rule`, `grade: JUDGMENT` → `rules.yaml`에 `grade: JUDGMENT`로 추가. `check` 없음
3. `destination: Option` → `options.yaml`에 추가. `choices`는 Case의 `fix`를 묶어 2개 이상으로 만든다. PREFERRED Case가 있는 쪽에 `recommended: true`
4. stance가 팽팽(P가 나머지 합과 같거나 1 차이)하면 Rule 후보라도 Option으로 내리고 로그에 "팽팽"이라 적는다
5. 내용이 서로 반대인 후보 둘(예: `whitespace up` vs `density up`)은 둘 다 올리고 `conflicts_with`로 잇는다
6. **명문 규격 일치**: Case 내용이 아래 규격 표와 맞으면 반복 수·어조와 무관하게 Rule로 올리고 `source: standard` · `standard_ref`를 단다. `promoted_from`에 해당 Case를 적는다

CHECKABLE `check` 식 표 (스냅샷 요소 `el`, 헬퍼 `num` · `contrast`는 Task 10에서 만든다):

| property | check |
|---|---|
| touch-target (≥N px) | `Math.min(el.box.width, el.box.height) >= N` |
| contrast (≥R) | `contrast(el.style.color, el.style['background-color']) >= R` |
| radius (= N px) | `Math.abs(num(el.style['border-radius']) - N) <= 1` |
| font-size (≥N px) | `num(el.style['font-size']) >= N` |
| line-height (≥N × font) | `num(el.style['line-height']) >= num(el.style['font-size']) * N` |
| padding (≥N px, 네 변 최소) | `Math.min(...['top','right','bottom','left'].map(s => num(el.style['padding-' + s]))) >= N` |
| focus ring (state: focus-visible) | `num(el.style['outline-width']) >= 2 && el.style['outline-style'] !== 'none'` |

명문 규격 표 (source: standard 후보):

| standard_ref | statement | scope | check |
|---|---|---|---|
| WCAG 2.2 SC 1.4.3 | 본문 텍스트와 배경 대비 4.5:1 이상 | `{}` | `contrast(el.style.color, el.style['background-color']) >= 4.5` |
| WCAG 2.2 SC 2.5.8 + Apple HIG | 터치 타겟 최소 44×44 (모바일) | `{ platform: mobile }` | `Math.min(el.box.width, el.box.height) >= 44` |
| WCAG 2.2 SC 2.4.7 | 포커스 상태가 눈에 보여야 한다 | `{}`, `state: focus-visible` | `num(el.style['outline-width']) >= 2 && el.style['outline-style'] !== 'none'` |

이 세 규격 Rule은 코퍼스에 일치 Case가 없어도 추가한다(`promoted_from: []`, `confidence: 0`). 6단계 기본기 판정이 이걸 쓴다.

- [ ] **Step 3: Quality 확정**

Quality 후보 표의 `target` 형용사를 사람이 동의어로 묶는다(예: 과감한 · 대담한 · 강한 → `quality-bold`, label `과감한`, aliases 나머지). 묶은 뒤 `realized_by`를 만든다. 항목마다 `weight`는 후보의 `weight`, `cases`는 후보의 `cases`. `scope`는 그 Case들의 scope에 공통값이 있을 때만 적는다(전부 `context: hero`면 `scope: { context: hero }`). 반대 뜻 형용사(과감한 ↔ 차분한)는 `opposes`로 잇는다.

파일 형식은 `docs/plan.md`의 Quality 절과 `test/fixtures/kg/qualities.yaml`을 따른다.

- [ ] **Step 4: promotion-log.md**

```markdown
# 승격 로그

| 날짜 | 후보 key | 결정 | 목적지 | 이유 |
|---|---|---|---|---|
| 2026-MM-DD | button\|touch-target\|up | 승격 | rule-001 CHECKABLE | 영상 5개, P 4/1/0, 44·44·48·44·44 일치 |
| 2026-MM-DD | hero\|type-scale\|up | 승격 | option-001 | P 1/3/2 → Option. PREFERRED 쪽 recommended |
| 2026-MM-DD | card\|shadow\|up | 강등 | option-004 | P 2/2/0 팽팽 |
| 2026-MM-DD | (standard) | 추가 | rule-002 · rule-003 · rule-004 | WCAG 1.4.3 · 2.5.8 · 2.4.7 |
```

실제 행으로 채운다.

- [ ] **Step 5: docs/schema.md**

`docs/plan.md`의 "지식그래프" 절(노드 · 엣지 · 승격 게이트)을 옮겨 오되, Task 8에서 실제로 겪은 것으로 고친다. 특히: property 어휘 최종 목록(실제 Case에 나온 값들), `scope.component` 최종 목록, `check` 식 표, 어조 판정에서 헷갈렸던 어미와 결정. 이 파일이 이후 인제스천의 기준이다.

- [ ] **Step 6: 검증**

```bash
npm run validate
grep -c "^- id: quality-" kg/qualities.yaml
```

Expected: validate ok. Quality 5개 이상, 각 `realized_by` 2개 이상(`grep -A30`으로 눈으로 확인). 미달이면 사용자에게 보고하고 `docs/plan.md` 4단계의 분기(코퍼스 선별 문제 → Task 4로)를 따른다. `source: corpus` CHECKABLE Rule 수는 결과로 보고만 한다.

- [ ] **Step 7: 커밋 · PR**

```bash
git add kg/rules.yaml kg/options.yaml kg/qualities.yaml kg/promotion-log.md docs/schema.md
git commit -m "feat(promotion): Rule · Option · Quality 승격 및 스키마 확정"
git push -u origin feat/promotion
gh pr create --title "feat(promotion): 승격 후보 계산 · 1차 승격 · 스키마 확정" --body "T7~T8. validate: <붙여넣기>. Rule N(corpus CHECKABLE n / JUDGMENT n / standard 3) · Option N · Quality N."
```

---

### Task 9: 조회 함수 [Opus]

**Files:**
- Create: `src/scope.ts`, `src/query.ts`, `test/query.test.ts`

**Interfaces:**
- Consumes: `Kg` · `Scope` · `Rule` · `Option` · `Quality` · `Case` 타입, `test/fixtures/kg`
- Produces:
  ```ts
  type ScopeQuery = Partial<Scope>;
  function matchesScope(target: Scope, q: ScopeQuery, mode?: "query" | "strict"): boolean;   // src/scope.ts
  // query(기본): q에 없거나 any인 필드는 와일드카드. 에이전트가 모르는 조건은 넓게 받는다
  // strict: target이 any가 아니면 q 값과 정확히 같아야 한다. 검증에서 쓴다 — context를 모르는 요소에 hero 규칙을 들이대지 않는다
  type CaseSummary = { id: string; video: string; t: string; url: string; problem: string; fix: string; stance: Stance; quote: string; measured?: Measured };
  function caseSummary(c: Case): CaseSummary;
  function queryRules(kg: Kg, q: ScopeQuery): Array<Rule & { conflicts: Rule[] }>;
  function queryOptions(kg: Kg, q: ScopeQuery): Option[];
  type QualityAnswer = { quality: Quality; realized_by: Quality["realized_by"]; opposes: Quality | null; rules: Rule[] };
  function queryQualities(kg: Kg, term: string, q?: ScopeQuery): QualityAnswer | null;
  function queryCases(kg: Kg, id: string): { kind: "rule" | "option" | "quality"; node: Rule | Option | Quality; cases: CaseSummary[] } | null;
  ```
  Task 10 · 12가 쓴다

- [ ] **Step 1: 실패하는 테스트**

`test/query.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { loadKg } from "../src/load.js";
import { caseSummary, queryCases, queryOptions, queryQualities, queryRules } from "../src/query.js";
import { matchesScope } from "../src/scope.js";
import { Scope } from "../src/schema.js";

const kg = loadKg(new URL("./fixtures/kg", import.meta.url).pathname);

describe("matchesScope", () => {
  const button = Scope.parse({ component: "button", platform: "mobile" });
  it("matches when every non-any target field equals the query", () => {
    expect(matchesScope(button, { component: "button", platform: "mobile" })).toBe(true);
    expect(matchesScope(button, { component: "button", platform: "web" })).toBe(false);
    expect(matchesScope(button, { component: "card" })).toBe(false);
  });
  it("treats a missing or any query field as wildcard", () => {
    expect(matchesScope(button, {})).toBe(true);
    expect(matchesScope(button, { component: "button", platform: "any" })).toBe(true);
  });
  it("any on the target matches anything", () => {
    expect(matchesScope(Scope.parse({}), { component: "hero", platform: "web", size: "lg" })).toBe(true);
  });
  it("strict mode does not wildcard on the query side", () => {
    const hero = Scope.parse({ context: "hero" });
    expect(matchesScope(hero, { context: "any" }, "strict")).toBe(false);
    expect(matchesScope(hero, {}, "strict")).toBe(false);
    expect(matchesScope(hero, { context: "hero" }, "strict")).toBe(true);
    expect(matchesScope(Scope.parse({}), { context: "any" }, "strict")).toBe(true);
  });
});

describe("queryRules", () => {
  it("returns matching rules, CHECKABLE first, with conflicts resolved", () => {
    const r = queryRules(kg, { component: "button", platform: "mobile", context: "list" });
    expect(r.map((x) => x.id)).toEqual(["rule-001", "rule-002"]);
    expect(r[0].conflicts).toEqual([]);
  });
  it("treats unspecified fields as wildcard", () => {
    expect(queryRules(kg, { component: "button", platform: "mobile" }).map((x) => x.id))
      .toEqual(["rule-001", "rule-002", "rule-003"]);
  });
  it("excludes mobile-only rules on web and keeps hero JUDGMENT rules", () => {
    expect(queryRules(kg, { platform: "web", context: "hero" }).map((x) => x.id)).toEqual(["rule-002", "rule-003"]);
  });
});

describe("queryOptions", () => {
  it("filters by scope", () => {
    expect(queryOptions(kg, { component: "card" }).map((o) => o.id)).toEqual(["option-001"]);
    expect(queryOptions(kg, { component: "button" })).toEqual([]);
  });
});

describe("queryQualities", () => {
  it("finds by label or alias", () => {
    expect(queryQualities(kg, "과감한")!.quality.id).toBe("quality-bold");
    expect(queryQualities(kg, " 대담한 ")!.quality.id).toBe("quality-bold");
    expect(queryQualities(kg, "없는말")).toBeNull();
  });
  it("sorts realized_by by weight and filters by scope", () => {
    const a = queryQualities(kg, "과감한")!;
    expect(a.realized_by.map((r) => r.property)).toEqual(["type-scale", "whitespace"]);
    const b = queryQualities(kg, "과감한", { context: "list" })!;
    expect(b.realized_by.map((r) => r.property)).toEqual(["whitespace"]);
  });
  it("resolves opposes and attaches scoped rules", () => {
    const a = queryQualities(kg, "과감한", { context: "hero", platform: "web" })!;
    expect(a.opposes!.id).toBe("quality-subtle");
    expect(a.rules.map((r) => r.id)).toEqual(["rule-002", "rule-003"]);
  });
});

describe("queryCases", () => {
  it("returns cases behind a rule with youtube links", () => {
    const r = queryCases(kg, "rule-001")!;
    expect(r.kind).toBe("rule");
    expect(r.cases.map((c) => c.id)).toEqual(["case-001", "case-002", "case-003"]);
    expect(r.cases[0].url).toBe("https://youtu.be/dQw4w9WgXcQ?t=252");
  });
  it("collects cases across option choices and quality realized_by", () => {
    expect(queryCases(kg, "option-001")!.cases.map((c) => c.id)).toEqual(["case-007"]);
    expect(queryCases(kg, "quality-bold")!.cases.map((c) => c.id)).toEqual(["case-004", "case-005", "case-006"]);
  });
  it("returns null for unknown ids", () => {
    expect(queryCases(kg, "rule-999")).toBeNull();
    expect(queryCases(kg, "case-001")).toBeNull();
  });
});

describe("caseSummary", () => {
  it("converts h:mm:ss", () => {
    const c = { ...kg.cases[0], source: { video: "dQw4w9WgXcQ", t: "1:02:03" } };
    expect(caseSummary(c).url).toBe("https://youtu.be/dQw4w9WgXcQ?t=3723");
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
npm test -- query
```

Expected: FAIL — module not found.

- [ ] **Step 3: 구현**

`src/scope.ts`:

```ts
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
```

`src/query.ts`:

```ts
import { matchesScope, type ScopeQuery } from "./scope.js";
import type { Case, Kg, Measured, Option, Quality, Rule, Stance } from "./schema.js";

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
```

- [ ] **Step 4: 통과 확인**

```bash
npm test -- query && npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git checkout -b feat/mcp
git add src/scope.ts src/query.ts test/query.test.ts
git commit -m "feat(query): scope 매칭 · rules/options/qualities/cases 조회"
```

---

### Task 10: 검증 엔진 [Opus]

**Files:**
- Create: `src/check.ts`, `test/check.test.ts`

**Interfaces:**
- Consumes: `Snapshot` · `SnapshotElement` · `Rule` 타입, `matchesScope`, `queryCases`
- Produces:
  ```ts
  function num(s: string | undefined): number;           // "12px" → 12, "1.5" → 1.5, 없으면 NaN
  function contrastRatio(fg: string, bg: string): number; // rgb()/rgba() 문자열, WCAG 상대휘도
  type Violation = { rule: string; statement: string; selector: string; state: string; actual: { box: SnapshotElement["box"]; style: Record<string, string> } };
  type JudgmentItem = { rule: string; statement: string; selector: string; state: string; element: SnapshotElement; cases: CaseSummary[] };
  type CheckResult = { violations: Violation[]; judgments: JudgmentItem[]; errors: Array<{ rule: string; message: string }>; checked: number };
  function check(kg: Kg, snapshot: Snapshot): CheckResult;
  ```
  Task 12가 `design_check`로 노출한다. `check` 식은 `el` · `num` · `contrast` 세 이름만 볼 수 있다

- [ ] **Step 1: 실패하는 테스트**

`test/check.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { check, contrastRatio, num } from "../src/check.js";
import { loadKg } from "../src/load.js";
import { Snapshot } from "../src/schema.js";

const kg = loadKg(new URL("./fixtures/kg", import.meta.url).pathname);

const el = (over: Record<string, unknown>) => ({
  ui: "button", selector: "[data-snap-id=\"0\"]", state: "default",
  box: { x: 0, y: 0, width: 120, height: 44 },
  style: { color: "rgb(0, 0, 0)", "background-color": "rgb(255, 255, 255)" },
  ...over,
});

const snap = (elements: unknown[], platform = "mobile") =>
  Snapshot.parse({ url: "file:///t.html", platform, viewport: { width: 390, height: 844 }, capturedAt: "2026-09-10T00:00:00Z", elements });

describe("num", () => {
  it("parses px and unitless", () => {
    expect(num("12px")).toBe(12);
    expect(num("1.5")).toBe(1.5);
    expect(num("0.75rem")).toBe(0.75);
    expect(Number.isNaN(num(undefined))).toBe(true);
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for same colors", () => {
    expect(contrastRatio("rgb(0, 0, 0)", "rgb(255, 255, 255)")).toBeCloseTo(21, 1);
    expect(contrastRatio("rgb(128, 128, 128)", "rgb(128, 128, 128)")).toBeCloseTo(1, 3);
  });
  it("is symmetric and ignores alpha", () => {
    expect(contrastRatio("rgba(255, 255, 255, 0.5)", "rgb(0, 0, 0)")).toBeCloseTo(21, 1);
  });
  it("returns NaN for unparsable input", () => {
    expect(Number.isNaN(contrastRatio("transparent", "rgb(0,0,0)"))).toBe(true);
  });
});

describe("check", () => {
  it("passes a compliant element", () => {
    const r = check(kg, snap([el({})]));
    expect(r.violations).toEqual([]);
    expect(r.checked).toBe(2);
  });

  it("flags a small touch target on mobile only", () => {
    const small = el({ box: { x: 0, y: 0, width: 120, height: 32 } });
    expect(check(kg, snap([small])).violations.map((v) => v.rule)).toEqual(["rule-001"]);
    expect(check(kg, snap([small], "web")).violations).toEqual([]);
  });

  it("flags low contrast with the actual values", () => {
    const grey = el({ style: { color: "rgb(150, 150, 150)", "background-color": "rgb(255, 255, 255)" } });
    const v = check(kg, snap([grey])).violations;
    expect(v.map((x) => x.rule)).toEqual(["rule-002"]);
    expect(v[0].actual.style.color).toBe("rgb(150, 150, 150)");
  });

  it("only evaluates a rule in its declared state", () => {
    const focused = el({ state: "focus-visible", box: { x: 0, y: 0, width: 120, height: 32 } });
    expect(check(kg, snap([focused])).violations).toEqual([]);
  });

  it("packages JUDGMENT rules per element with cases", () => {
    const hero = el({ ui: "hero", context: "hero" });
    const r = check(kg, snap([hero], "web"));
    expect(r.judgments).toHaveLength(1);
    expect(r.judgments[0].rule).toBe("rule-003");
    expect(r.judgments[0].cases.map((c) => c.id)).toEqual(["case-004"]);
  });

  it("reports a broken check expression instead of throwing", () => {
    const broken = { ...kg, rules: [{ ...kg.rules[0], check: "this is not js" }] };
    const r = check(broken, snap([el({})]));
    expect(r.errors[0].rule).toBe("rule-001");
    expect(r.violations).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
npm test -- check
```

Expected: FAIL — module not found.

- [ ] **Step 3: 구현**

`src/check.ts`:

```ts
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

const compiled = new Map<string, (el: SnapshotElement, num: typeof num, contrast: typeof contrastRatio) => unknown>();

function evalCheck(rule: Rule, el: SnapshotElement): boolean {
  let fn = compiled.get(rule.check!);
  if (!fn) {
    fn = new Function("el", "num", "contrast", `"use strict"; return (${rule.check});`) as typeof fn;
    compiled.set(rule.check!, fn!);
  }
  return Boolean(fn!(el, num, contrastRatio));
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
```

- [ ] **Step 4: 통과 확인**

```bash
npm test -- check && npm run typecheck
```

Expected: PASS. `checked`가 2인 이유: 첫 테스트의 요소(mobile button, context any)에 rule-001 · rule-002가 매칭되고, rule-003(context hero)은 strict 매칭이라 제외된다.

- [ ] **Step 5: 커밋**

```bash
git add src/check.ts test/check.test.ts
git commit -m "feat(check): CHECKABLE 식 평가 · 대비율 · JUDGMENT 묶음"
```

---

### Task 11: 스냅샷 스크립트 [Opus]

**Files:**
- Create: `scripts/snapshot.ts`, `test/snapshot.test.ts`, `test/fixtures/page.html`

**Interfaces:**
- Consumes: `Snapshot` 스키마
- Produces: `snapshotPage(url: string, opts: { platform: "web" | "mobile" }): Promise<Snapshot>` (export), CLI `npm run snapshot -- --url <url> --out <file> [--platform mobile]`. Task 12 `design_check`의 입력 파일을 만든다. Task 13이 실제로 돌린다

- [ ] **Step 1: Chromium 설치**

```bash
npx playwright install chromium
```

- [ ] **Step 2: 픽스처 페이지**

`test/fixtures/page.html`:

```html
<!doctype html>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 16px; background: #fff; color: #111; font: 16px/1.5 sans-serif; }
  [data-ui="button"] { height: 44px; padding: 0 20px; border: 0; border-radius: 8px; background: #0071e3; color: #fff; }
  [data-ui="button"][data-size="sm"] { height: 28px; padding: 0 12px; }
  [data-ui="button"]:focus-visible { outline: 2px solid #0071e3; outline-offset: 2px; }
  [data-ui="text"].muted { color: #9a9a9a; }
  section[data-context="hero"] [data-ui="heading"] { font-size: 48px; }
</style>
<section data-context="hero">
  <h1 data-ui="heading">Hero title</h1>
  <button data-ui="button" data-variant="primary" data-size="md">Primary</button>
</section>
<section>
  <button data-ui="button" data-variant="ghost" data-size="sm">Small</button>
  <p data-ui="text" class="muted">Muted text</p>
  <div>no data-ui, ignored</div>
</section>
```

- [ ] **Step 3: 실패하는 테스트**

`test/snapshot.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { snapshotPage } from "../scripts/snapshot.js";

const url = new URL("./fixtures/page.html", import.meta.url).href;

describe("snapshotPage", () => {
  it("collects only data-ui elements with box, style, context and states", async () => {
    const snap = await snapshotPage(url, { platform: "web" });
    const defaults = snap.elements.filter((e) => e.state === "default");
    expect(defaults.map((e) => e.ui)).toEqual(["heading", "button", "button", "text"]);
    expect(defaults[0].context).toBe("hero");
    expect(defaults[1]).toMatchObject({ variant: "primary", size: "md", context: "hero" });
    expect(defaults[1].box.height).toBe(44);
    expect(defaults[2].box.height).toBe(28);
    expect(defaults[3].style.color).toBe("rgb(154, 154, 154)");
    expect(defaults[3].style["background-color"]).toBe("rgb(255, 255, 255)");
    expect(defaults[3].text).toBe("Muted text");
  }, 30_000);

  it("captures focus-visible for tabbable elements", async () => {
    const snap = await snapshotPage(url, { platform: "web" });
    const focused = snap.elements.filter((e) => e.state === "focus-visible");
    expect(focused.map((e) => e.selector)).toEqual(['[data-snap-id="1"]', '[data-snap-id="2"]']);
    expect(focused[0].style["outline-style"]).toBe("solid");
    expect(focused[0].style["outline-width"]).toBe("2px");
  }, 30_000);

  it("uses a phone viewport for mobile", async () => {
    const snap = await snapshotPage(url, { platform: "mobile" });
    expect(snap.viewport).toEqual({ width: 390, height: 844 });
    expect(snap.platform).toBe("mobile");
  }, 30_000);
});
```

- [ ] **Step 4: 실패 확인**

```bash
npm test -- snapshot
```

Expected: FAIL — module not found.

- [ ] **Step 5: 구현**

`scripts/snapshot.ts`:

```ts
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { Snapshot, type SnapshotElement } from "../src/schema.js";

const PROPS = [
  "color", "background-color", "font-size", "font-weight", "line-height", "letter-spacing",
  "border-radius", "border-width", "box-shadow",
  "padding-top", "padding-right", "padding-bottom", "padding-left", "gap",
  "outline-width", "outline-style", "outline-color", "opacity", "transition-duration",
];

const VIEWPORT = { web: { width: 1280, height: 800 }, mobile: { width: 390, height: 844 } };

// 브라우저 안에서 실행된다. 인자 외의 바깥 변수를 참조하면 안 된다.
function readElement(el: Element, props: string[], state: string) {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const style: Record<string, string> = {};
  for (const p of props) style[p] = cs.getPropertyValue(p);
  // 배경이 투명하면 가장 가까운 불투명 조상 배경을 쓴다 (대비 계산용)
  let node: Element | null = el;
  while (node && /rgba\(\d+, \d+, \d+, 0\)|transparent/.test(style["background-color"])) {
    node = node.parentElement;
    if (node) style["background-color"] = getComputedStyle(node).getPropertyValue("background-color");
  }
  const ctx = el.closest("[data-context]")?.getAttribute("data-context") ?? "any";
  return {
    ui: el.getAttribute("data-ui")!,
    variant: el.getAttribute("data-variant") ?? "any",
    size: el.getAttribute("data-size") ?? "any",
    context: ctx,
    selector: `[data-snap-id="${el.getAttribute("data-snap-id")}"]`,
    state,
    box: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
    style,
    text: (el.textContent ?? "").trim().slice(0, 80) || undefined,
  };
}

export async function snapshotPage(url: string, opts: { platform: "web" | "mobile" }): Promise<Snapshot> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: VIEWPORT[opts.platform] });
    await page.goto(url, { waitUntil: "networkidle" });

    const count = await page.evaluate(() => {
      const els = document.querySelectorAll("[data-ui]");
      els.forEach((el, i) => el.setAttribute("data-snap-id", String(i)));
      return els.length;
    });

    const defaults = await page.evaluate(
      ({ props, read }) => {
        const fn = new Function("return " + read)() as typeof readElement;
        return [...document.querySelectorAll("[data-ui]")].map((el) => fn(el, props, "default"));
      },
      { props: PROPS, read: readElement.toString() },
    );

    // Tab을 눌러 가며 키보드 포커스를 옮긴다. 키보드 포커스는 항상 :focus-visible을 켠다.
    const focused: unknown[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < count + 5; i++) {
      await page.keyboard.press("Tab");
      const one = await page.evaluate(
        ({ props, read }) => {
          const el = document.activeElement;
          if (!el || !el.hasAttribute("data-ui")) return null;
          const fn = new Function("return " + read)() as typeof readElement;
          return fn(el, props, "focus-visible");
        },
        { props: PROPS, read: readElement.toString() },
      );
      if (!one) continue;
      if (seen.has(one.selector)) break;
      seen.add(one.selector);
      focused.push(one);
    }

    return Snapshot.parse({
      url, platform: opts.platform, viewport: VIEWPORT[opts.platform],
      capturedAt: new Date().toISOString(),
      elements: [...defaults, ...focused] as SnapshotElement[],
    });
  } finally {
    await browser.close();
  }
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

if (process.argv[1] && process.argv[1].endsWith("snapshot.ts")) {
  const url = arg("url");
  const out = arg("out");
  const platform = (arg("platform") ?? "web") as "web" | "mobile";
  if (!url || !out) {
    console.error("usage: npm run snapshot -- --url <url> --out <file> [--platform web|mobile]");
    process.exit(1);
  }
  const snap = await snapshotPage(url, { platform });
  writeFileSync(out, JSON.stringify(snap, null, 2));
  console.log(`${snap.elements.length} elements → ${out}`);
}
```

- [ ] **Step 6: 통과 확인**

```bash
npm test -- snapshot && npm run typecheck
mkdir -p .evidence/snapshots
npm run snapshot -- --url "file://$PWD/test/fixtures/page.html" --out .evidence/snapshots/fixture.json --platform mobile
```

Expected: PASS. CLI `6 elements → .evidence/snapshots/fixture.json`. 포커스 테스트가 깨지면(`focused`가 비어 있음) `page.keyboard.press("Tab")` 전에 `await page.mouse.click(0, 0)`을 넣지 말 것 — 마우스 클릭은 focus-visible을 끈다. 대신 `page.goto` 직후 `await page.evaluate(() => document.body.focus())`를 시도한다.

- [ ] **Step 7: 커밋**

```bash
git add scripts/snapshot.ts test/snapshot.test.ts test/fixtures/page.html
git commit -m "feat(snapshot): Playwright computed-style 스냅샷 · focus-visible 캡처"
```

---

### Task 12: MCP 서버 [Opus]

**Files:**
- Create: `mcp/server.ts`, `mcp/index.ts`, `test/server.test.ts`, `.mcp.json`
- Modify: `README.md` (사용법 절 추가)

**Interfaces:**
- Consumes: `loadKg` · `queryRules` · `queryOptions` · `queryQualities` · `queryCases` · `check` · `Snapshot`
- Produces: `createServer(kgDir: string): McpServer` (export). 툴 5개. 모든 툴은 JSON을 `text` 콘텐츠로 돌려준다. `design_check` 입력은 `snapshot_path`(파일 경로)

- [ ] **Step 1: 실패하는 테스트**

`test/server.test.ts`:

```ts
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
```

- [ ] **Step 2: 실패 확인**

```bash
npm test -- server
```

Expected: FAIL — module not found.

- [ ] **Step 3: 구현**

`mcp/server.ts`:

```ts
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
        "JUDGMENT는 요소별로 근거 사례를 붙여 judgments로 돌려주니 그건 호출자가 판단한다. Option · Quality는 판정하지 않는다.",
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
```

`mcp/index.ts`:

```ts
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { fileURLToPath } from "node:url";
import { createServer } from "./server.js";

const kgDir = process.env.DESIGN_KG_DIR ?? fileURLToPath(new URL("../kg", import.meta.url));
const server = createServer(kgDir);
await server.connect(new StdioServerTransport());
```

`.mcp.json` (레포 루트, Claude Code가 이 디렉터리에서 뜨면 자동 인식):

```json
{
  "mcpServers": {
    "design-kg": {
      "command": "npm",
      "args": ["run", "-s", "mcp"]
    }
  }
}
```

- [ ] **Step 4: 통과 확인**

```bash
npm test && npm run typecheck
```

Expected: 전부 PASS. `server.connect`가 타입 오류를 내면 `await server.server.connect(st)`로 바꾼다(SDK 버전에 따라 둘 중 하나).

- [ ] **Step 5: stdio로 한 번 띄워 보기**

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"probe","version":"0"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  | DESIGN_KG_DIR=test/fixtures/kg npm run -s mcp 2>/dev/null | grep -o '"name":"design_[a-z]*"' | sort -u
```

Expected: 다섯 줄. `initialize` 응답이 protocolVersion 불일치로 실패하면 응답에 찍힌 버전으로 바꿔 다시 시도한다.

- [ ] **Step 6: README 사용법**

`README.md` 끝에 추가:

```markdown
## 사용

```bash
npm install && npx playwright install chromium
npm run validate                 # kg/ 검증
npm run candidates               # 승격 후보 표
npm run snapshot -- --url <url> --out .evidence/snapshots/x.json --platform mobile
npm run mcp                      # stdio MCP 서버 (Claude Code는 .mcp.json으로 자동 연결)
```

Claude Code에서 이 디렉터리를 열면 `.mcp.json`의 `design-kg` 서버가 뜬다. `/mcp`로 확인.
```

- [ ] **Step 7: 커밋 · PR**

```bash
git add mcp .mcp.json test/server.test.ts README.md
git commit -m "feat(mcp): design-kg MCP 서버 툴 5개 · stdio 진입점"
git push -u origin feat/mcp
gh pr create --title "feat(mcp): 조회 · 검증 · 스냅샷 · MCP 서버" --body "T9~T12. queryRules/Options/Qualities/Cases · check · snapshot.ts · MCP 툴 5개. 테스트 <N>개 통과."
```

---

### Task 13: 왕복 1회 기록 [Sonnet]

**Files:**
- Create: `docs/roundtrip-01.md`
- Create (로컬): `.evidence/roundtrip-01/` — 생성한 컴포넌트 HTML과 스냅샷

**Interfaces:**
- Consumes: 실제 `kg/`(Task 8), MCP 서버(Task 12), `npm run snapshot`

- [ ] **Step 1: 브랜치 · 서버 확인**

```bash
git checkout -b docs/roundtrip-01
npm run validate
```

design-kg 디렉터리에서 Claude Code를 새로 연다. `/mcp`에 `design-kg`가 connected로 보여야 한다. 안 보이면 `claude mcp list`로 `.mcp.json`이 읽혔는지 확인하고, 프로젝트 MCP 승인 프롬프트가 떴으면 승인한다.

- [ ] **Step 2: 왕복**

새 Claude Code 세션에서 순서대로 지시한다. 각 단계의 툴 호출 입력과 출력을 그대로 복사해 둔다.

1. `design_qualities`로 "과감한"을 조회해 (term: 과감한, context: hero, platform: web)
2. 결과의 realized_by 상위 2개와 rules를 근거로, 히어로 섹션(제목·부제·버튼 하나)을 단일 HTML 파일로 만들어 `.evidence/roundtrip-01/hero.html`에 저장해. 요소마다 `data-ui`(heading · text · button), 버튼에 `data-variant="primary" data-size="lg"`, 섹션에 `data-context="hero"`를 달아. 각 스타일 결정 옆에 주석으로 근거 Case ID를 적어
3. `npm run snapshot -- --url "file://$PWD/.evidence/roundtrip-01/hero.html" --out .evidence/roundtrip-01/hero.json --platform web`
4. `design_check`에 그 스냅샷을 넣어
5. violations가 있으면 고치고 3~4를 반복해. 최대 2회

- [ ] **Step 3: 기록**

`docs/roundtrip-01.md`:

```markdown
# 왕복 기록 01 — 히어로 섹션 "과감한"

날짜: 2026-MM-DD · KG: cases N · rules N · options N · qualities N

## 1. design_qualities("과감한", context: hero, platform: web)

<툴 출력 그대로>

## 2. 생성

<hero.html 전문. 주석의 Case ID 포함>

에이전트가 realized_by 중 고른 것: <property · direction · 근거 Case>
고르지 않은 것과 이유: <…>

## 3. design_check 1회차

<violations · judgments · errors 그대로>

## 4. 수정 · 2회차

<무엇을 고쳤나, 2회차 결과>

## 관찰

- 툴 설명이 부족해 에이전트가 헤맨 지점:
- 조회 결과에 있었으면 좋았을 것:
- check 식이 잡지 못한 것:
- 다음 왕복 전에 고칠 것 (Task 번호로):
```

- [ ] **Step 4: 커밋 · PR**

```bash
git add docs/roundtrip-01.md
git commit -m "docs(roundtrip): 왕복 1회 기록 — 히어로 섹션 과감한"
git push -u origin docs/roundtrip-01
gh pr create --title "docs(roundtrip): 왕복 1회 기록" --body "T13. 5단계 검증. 관찰 절의 후속 항목 참고."
```

---

## 완료 기준

- `npm test` 전부 통과, `npm run typecheck` 오류 없음
- `npm run validate` → 영상 20 · Case 100+ · Quality 5+ (각 realized_by 2+) · standard Rule 3
- `.mcp.json`으로 Claude Code에서 툴 5개가 보이고 `docs/roundtrip-01.md`에 왕복 1회가 있다
- `git log --all -- .evidence` 가 비어 있다 (증거 원본이 한 번도 커밋되지 않았다)
