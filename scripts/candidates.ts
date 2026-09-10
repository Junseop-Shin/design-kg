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
    `| ${c.key.replaceAll("|", "\\|")} | ${c.videos.length} | ${c.stance.PRESCRIPTIVE}/${c.stance.PREFERRED}/${c.stance.OPTION} | ${c.destination} | ${m} | ${c.grade ?? "-"} | ${c.cases.join(" ")} |`,
  );
}

console.log(`\n# Quality 후보 (영상 ${min}개 이상)\n`);
console.log("| 형용사 | property | direction | videos | weight | cases |");
console.log("|---|---|---|---|---|---|");
for (const q of qualityCandidates(kg.cases, min)) {
  console.log(`| ${q.target} | ${q.property} | ${q.direction} | ${q.videos.length} | ${q.weight} | ${q.cases.join(" ")} |`);
}
