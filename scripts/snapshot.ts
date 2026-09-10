import { writeFileSync } from "node:fs";
import { type BrowserContext, chromium } from "playwright";
import { Snapshot, type SnapshotElement } from "../src/schema.js";

const PROPS = [
  "color", "background-color", "font-size", "font-weight", "line-height", "letter-spacing",
  "border-radius", "border-width", "box-shadow",
  "padding-top", "padding-right", "padding-bottom", "padding-left", "gap",
  "outline-width", "outline-style", "outline-color", "opacity", "transition-duration",
];

// [data-ui]가 아닌 탭 가능 요소가 많은 페이지도 훑을 수 있는 상한
const TAB_BUDGET = 200;

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
  // 어떤 조상도 배경을 칠하지 않으면 브라우저 캔버스 기본색으로 본다
  if (/rgba\(\d+, \d+, \d+, 0\)|transparent/.test(style["background-color"])) {
    style["background-color"] = "rgb(255, 255, 255)";
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
  let context: BrowserContext | undefined;
  try {
    // new Function을 쓰므로 페이지 CSP(script-src에 'unsafe-eval' 없음)를 우회한다
    context = await browser.newContext({ viewport: VIEWPORT[opts.platform], bypassCSP: true });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });

    await page.evaluate(() => {
      document.querySelectorAll("[data-ui]").forEach((el, i) => el.setAttribute("data-snap-id", String(i)));
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
    let bodyStreak = 0;
    for (let i = 0; i < TAB_BUDGET; i++) {
      await page.keyboard.press("Tab");
      const one = await page.evaluate(
        ({ props, read }) => {
          const el = document.activeElement;
          if (!el || el === document.body) return "body" as const;
          if (!el.hasAttribute("data-ui")) return null;
          const fn = new Function("return " + read)() as typeof readElement;
          return fn(el, props, "focus-visible");
        },
        { props: PROPS, read: readElement.toString() },
      );
      if (one === "body") {
        // 탭 순서가 주소창을 지나 문서 밖으로 나갔다. 두 번 연속이면 한 바퀴 돈 것으로 본다
        if (seen.size > 0 && ++bodyStreak >= 2) break;
        continue;
      }
      bodyStreak = 0;
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
    await context?.close();
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
