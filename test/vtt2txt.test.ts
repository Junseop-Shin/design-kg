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
