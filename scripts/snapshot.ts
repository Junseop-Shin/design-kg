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
