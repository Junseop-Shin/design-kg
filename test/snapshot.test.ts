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
