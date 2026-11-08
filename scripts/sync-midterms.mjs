import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const model = path.join(root, "research/midterms-2026");
const reports = path.join(model, "reports");
const assets = path.join(root, "public/assets/writings/midterms-2026");
const article = JSON.parse(
  await fs.readFile(path.join(reports, "article.json"), "utf8"),
);
const predictions = JSON.parse(
  await fs.readFile(path.join(model, "website/live/predictions.json"), "utf8"),
);
const frozenCSV = (
  await fs.readFile(path.join(model, "results/2026-estimates.csv"), "utf8")
).replaceAll("\r\n", "\n");
assert.equal(
  createHash("sha256").update(frozenCSV).digest("hex"),
  predictions.sha256,
);
assert.equal(predictions.races.length, 470);
assert(article.sources.every((source) => source.group && source.url));

await fs.mkdir(assets, { recursive: true });
for (const figure of article.blocks.filter(
  (block) => block.type === "figure",
)) {
  for (const suffix of [".svg", "-mobile.svg"]) {
    const name = figure.slug + suffix;
    const svg = await fs.readFile(path.join(reports, "web", name), "utf8");
    await fs.writeFile(
      path.join(assets, name),
      svg.replace(/[\t ]+(?=\r?$)/gm, ""),
    );
  }
}
for (const [source, destination] of [
  ["results/2026-estimates.csv", "2026-estimates.csv"],
  ["results/historical-cycle-scores.csv", "historical-cycle-scores.csv"],
  ["results/masked-poll-scores.csv", "masked-poll-scores.csv"],
  ["results/validation-benchmarks.csv", "validation-benchmarks.csv"],
  ["results/selected-model.json", "selected-model.json"],
  ["results/benchmark/leaderboard.csv", "benchmark-leaderboard.csv"],
  ["results/benchmark/selection-policy.csv", "benchmark-selection-policy.csv"],
  ["reports/training-coverage.csv", "training-coverage.csv"],
  ["reports/run.json", "run.json"],
  ["reports/2026-house-map.png", "preview.png"],
])
  await fs.copyFile(path.join(model, source), path.join(assets, destination));
await fs.writeFile(
  path.join(root, "src/content/midterms-2026.json"),
  JSON.stringify(article, null, 2) + "\n",
);
execFileSync(
  process.execPath,
  [path.join(root, "scripts/embed-midterm-figures.cjs")],
  { cwd: root, stdio: "inherit" },
);
console.log(
  "Synced the article, figures and frozen estimates from this repository.",
);
