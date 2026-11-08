import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import {
  normalizeRollup,
  acceptUpdate,
  compareRace,
  summarize,
  validateSnapshot,
} from "../website/live/core.mjs";

const predictions = JSON.parse(
  fs.readFileSync(new URL("../website/live/predictions.json", import.meta.url)),
);
const snapshot = JSON.parse(
  fs.readFileSync(
    new URL("../data/results/live-snapshot.json", import.meta.url),
  ),
);

export function rollup(chamber) {
  const saved = snapshot[chamber];
  return {
    test_data: false,
    country: "US",
    election_scope: "General",
    election_type:
      chamber === "house" ? "House of Representatives" : "US Senate",
    election_date: "2026-11-03T05:00:00.000Z",
    last_updated: saved.updatedAt,
    region_results: Object.fromEntries(
      predictions.races
        .filter((r) => r.chamber === chamber)
        .map((f) => {
          const r = saved.races[f.id];
          return [
            (chamber === "house" ? f.label : f.state).toLowerCase(),
            {
              name: r.name,
              percent_reporting: r.reporting,
              candidates: r.candidates.map((c) => ({
                ...c,
                party: c.sourceParty,
              })),
            },
          ];
        }),
    ),
  };
}

test("the browser uses the exact frozen forecast, not observed outcomes", () => {
  const csv = fs
    .readFileSync(
      new URL("../results/2026-estimates.csv", import.meta.url),
      "utf8",
    )
    .replaceAll("\r\n", "\n");
  assert.equal(
    predictions.sha256,
    createHash("sha256").update(csv).digest("hex"),
  );
  assert.equal(predictions.races.length, 470);
  assert.equal(new Set(predictions.races.map((r) => r.id)).size, 470);
});

test("national feeds match all districts and only the 35 contested Senate seats", () => {
  for (const chamber of ["house", "senate"]) {
    const normalized = normalizeRollup(
      rollup(chamber),
      chamber,
      predictions.races,
      snapshot[chamber].receivedAt,
    );
    assert.equal(
      Object.keys(normalized.races).length,
      chamber === "house" ? 435 : 35,
    );
    assert(validateSnapshot(normalized, chamber, predictions.races));
    assert.equal(
      summarize(predictions.races, normalized, chamber).called,
      chamber === "house" ? 413 : 33,
    );
  }
});

test("an uncalled leader does not become a winner or enter called-race scores", () => {
  const f = predictions.races.find(
    (r) => r.chamber === "senate" && r.state === "MS",
  );
  const r = snapshot.senate.races[f.id];
  assert(r.total > 0);
  assert.equal(compareRace(f, r).correct, null);
  const single = summarize([f], snapshot.senate, "senate");
  assert.equal(single.called, 0);
  assert.equal(single.scored, 0);
  assert.equal(single.mae, null);
});

test("vote shares exclude third parties and special treatments", () => {
  const f = {
    id: "test",
    chamber: "house",
    kind: "D/R",
    share: 48,
    baseline: 45,
    party: "REP",
    fixed: false,
  };
  const r = {
    calledParty: "DEM",
    candidates: [
      { party: "DEM", votes: 60 },
      { party: "REP", votes: 40 },
      { party: "OTHER", votes: 900 },
    ],
  };
  assert.equal(compareRace(f, r).actual, 60);
  assert.equal(compareRace(f, r).error, 12);
  for (const kind of [
    "Independent transfer",
    "D/R; first-preference proxy",
    "Party aggregate; runoff possible",
    "One party on ballot",
  ])
    assert.equal(compareRace({ ...f, kind }, r).actual, null);
  const scores = summarize([f], { races: { test: r } }, "house");
  assert.equal(scores.mae, 12);
  assert.equal(scores.baselineMae, 15);
});

test("bad, partial and wrong-election responses cannot replace a good snapshot", () => {
  for (const change of [
    (p) => {
      p.test_data = true;
    },
    (p) => {
      p.election_date = "2024-11-05";
    },
    (p) => {
      p.election_scope = "Primary";
    },
    (p) => {
      delete p.region_results.ms;
    },
    (p) => {
      p.region_results.ms.candidates[0].votes = -1;
    },
    (p) => {
      p.region_results.ms.candidates[0].winner = true;
      p.region_results.ms.candidates[1].winner = true;
    },
  ]) {
    const p = rollup("senate");
    change(p);
    assert.throws(() => normalizeRollup(p, "senate", predictions.races));
  }
  assert.throws(() =>
    acceptUpdate(snapshot.senate, {
      ...snapshot.senate,
      updatedAt: "2026-11-01T00:00:00Z",
    }),
  );
  assert(
    !validateSnapshot(
      { ...snapshot.senate, races: {} },
      "senate",
      predictions.races,
    ),
  );
});

test("legitimate vote-count corrections are accepted without changing the model", () => {
  const before = JSON.stringify(predictions);
  const next = rollup("senate");
  next.last_updated = "2026-11-09T00:00:00Z";
  next.region_results.ms.candidates[0].votes -= 10;
  const result = acceptUpdate(
    snapshot.senate,
    normalizeRollup(next, "senate", predictions.races),
  );
  assert(
    result.races["2026_senate_MS"].total <
      snapshot.senate.races["2026_senate_MS"].total,
  );
  assert.equal(JSON.stringify(predictions), before);
});
