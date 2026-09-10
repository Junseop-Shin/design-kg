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
