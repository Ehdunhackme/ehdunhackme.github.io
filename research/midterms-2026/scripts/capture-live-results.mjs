// Explicit snapshot capture. The website refreshes itself; this script is not scheduled.
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { FEEDS, normalizeRollup, summarize } from "../website/live/core.mjs";

const root = new URL("../", import.meta.url);
const predictions = JSON.parse(
  await fs.readFile(new URL("website/live/predictions.json", root), "utf8"),
);
const snapshot = {},
  sources = {};
await Promise.all(
  Object.entries(FEEDS).map(async ([chamber, url]) => {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw Error(`${chamber}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const receivedAt = new Date().toISOString();
    snapshot[chamber] = normalizeRollup(
      JSON.parse(bytes),
      chamber,
      predictions.races,
      receivedAt,
    );
    sources[chamber] = {
      url,
      retrievedAt: receivedAt,
      sourceUpdatedAt: snapshot[chamber].updatedAt,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      cors: response.headers.get("access-control-allow-origin"),
    };
  }),
);
await fs.mkdir(new URL("data/results/", root), { recursive: true });
await fs.writeFile(
  new URL("data/results/live-snapshot.json", root),
  JSON.stringify(snapshot) + "\n",
);
await fs.writeFile(
  new URL("data/results/sources.json", root),
  JSON.stringify(
    {
      provider: "civicAPI",
      attribution: "https://civicapi.org",
      unofficial: true,
      sources,
    },
    null,
    2,
  ) + "\n",
);
for (const chamber of ["house", "senate"]) {
  const s = summarize(predictions.races, snapshot[chamber], chamber);
  console.log(
    chamber,
    JSON.stringify({
      called: s.called,
      matched: s.matched,
      scored: s.scored,
      mae: s.mae,
      bias: s.bias,
      baselineMae: s.baselineMae,
      predicted: s.predicted,
      reported: s.reported,
    }),
  );
  console.log(
    "Misses",
    s.misses
      .map((r) => `${r.label}: ${r.party} -> ${r.result.calledParty}`)
      .join(", "),
  );
}
