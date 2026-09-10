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
