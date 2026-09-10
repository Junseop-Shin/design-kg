import { coverage } from "../src/coverage.js";
import { loadKg } from "../src/load.js";

const kg = loadKg(process.argv[2] ?? "kg");
const c = coverage(kg);
console.log("| kg | ui | cases | videos | promoted |\n|---|---|---|---|---|");
for (const r of c.rows)
  console.log(`| ${r.kg} | ${r.ui.join(" ") || "-"} | ${r.cases} | ${r.videos} | ${r.promoted ? "yes" : "-"} |`);
const denom = c.rows.flatMap((r) => r.ui).length;
console.log(`\ncase coverage: ${Math.round(c.caseCoverage * 100)}% (${Math.round(c.caseCoverage * denom)}/${denom})`);
console.log(`promoted coverage: ${Math.round(c.promotedCoverage * 100)}% (${Math.round(c.promotedCoverage * denom)}/${denom})`);
console.log(`uncovered: ${c.uncovered.join(", ") || "-"}`);
