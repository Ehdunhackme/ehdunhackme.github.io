export const FEEDS = Object.freeze({
  house: "https://civicapi.org/api/v2/race/87524",
  senate: "https://civicapi.org/api/v2/race/87528",
});

const PARTIES = {
  democratic: "DEM",
  democrat: "DEM",
  republican: "REP",
  independent: "IND",
  "no labels": "NOL",
};
export const party = (name) =>
  PARTIES[String(name).trim().toLowerCase()] || "OTHER";

// Reject wrong elections and incomplete/malformed updates instead of turning them into zeros.
export function normalizeRollup(
  payload,
  chamber,
  forecasts,
  receivedAt = new Date().toISOString(),
) {
  if (
    payload?.test_data !== false ||
    payload.country !== "US" ||
    payload.election_scope !== "General" ||
    !payload.election_date?.startsWith("2026-11-03") ||
    !Number.isFinite(Date.parse(payload.last_updated)) ||
    !payload.region_results
  )
    throw Error("Unexpected election data");
  const expectedType =
    chamber === "house" ? "House of Representatives" : "US Senate";
  if (payload.election_type !== expectedType) throw Error("Wrong chamber");
  const races = {};
  for (const forecast of forecasts.filter((r) => r.chamber === chamber)) {
    const key = (
      chamber === "house" ? forecast.label : forecast.state
    ).toLowerCase();
    const region = payload.region_results[key];
    if (
      !region ||
      !Array.isArray(region.candidates) ||
      !region.candidates.length
    )
      throw Error(`Missing result: ${key}`);
    const candidates = region.candidates.map((candidate) => {
      if (
        !candidate.name ||
        !Number.isSafeInteger(candidate.votes) ||
        candidate.votes < 0 ||
        typeof candidate.winner !== "boolean"
      )
        throw Error(`Invalid candidate: ${key}`);
      return {
        name: candidate.name.trim(),
        party: party(candidate.party),
        sourceParty: candidate.party,
        votes: candidate.votes,
        winner: candidate.winner,
      };
    });
    const winners = candidates.filter((c) => c.winner);
    if (winners.length > 1) throw Error(`Ambiguous call: ${key}`);
    const reported = region.percent_reporting;
    if (
      reported != null &&
      (!Number.isFinite(reported) || reported < 0 || reported > 100)
    )
      throw Error(`Invalid reporting percentage: ${key}`);
    const sorted = [...candidates].sort((a, b) => b.votes - a.votes);
    const total = candidates.reduce((sum, c) => sum + c.votes, 0);
    const leader =
      total && (!sorted[1] || sorted[0].votes > sorted[1].votes)
        ? sorted[0].party
        : null;
    races[forecast.id] = {
      name: typeof region.name === "string" ? region.name : forecast.label,
      candidates,
      calledParty: winners[0]?.party || null,
      calledName: winners[0]?.name || null,
      leader,
      reporting: reported ?? null,
      total,
    };
  }
  return { updatedAt: payload.last_updated, receivedAt, races };
}

export function acceptUpdate(previous, incoming) {
  if (
    previous &&
    Date.parse(incoming.updatedAt) < Date.parse(previous.updatedAt)
  )
    throw Error("The feed returned an older update");
  return incoming;
}

export function validateSnapshot(value, chamber, forecasts) {
  if (
    !value ||
    !Number.isFinite(Date.parse(value.updatedAt)) ||
    !Number.isFinite(Date.parse(value.receivedAt))
  )
    return false;
  return forecasts
    .filter((r) => r.chamber === chamber)
    .every((f) => {
      const r = value.races?.[f.id];
      if (!r || !Array.isArray(r.candidates) || !r.candidates.length)
        return false;
      if (
        !r.candidates.every(
          (c) =>
            typeof c.name === "string" &&
            ["DEM", "REP", "IND", "NOL", "OTHER"].includes(c.party) &&
            Number.isSafeInteger(c.votes) &&
            c.votes >= 0 &&
            typeof c.winner === "boolean",
        )
      )
        return false;
      const winners = r.candidates.filter((c) => c.winner);
      return (
        winners.length <= 1 &&
        r.calledParty === (winners[0]?.party || null) &&
        r.total === r.candidates.reduce((s, c) => s + c.votes, 0) &&
        (r.reporting === null ||
          (Number.isFinite(r.reporting) &&
            r.reporting >= 0 &&
            r.reporting <= 100))
      );
    });
}

export function compareRace(forecast, result) {
  const d =
    result?.candidates
      .filter((c) => c.party === "DEM")
      .reduce((s, c) => s + c.votes, 0) || 0;
  const r =
    result?.candidates
      .filter((c) => c.party === "REP")
      .reduce((s, c) => s + c.votes, 0) || 0;
  // A partisan transfer or ranked-choice proxy is not an ordinary D/R vote-share prediction.
  const actual =
    forecast.kind === "D/R" && Number.isFinite(forecast.share) && d > 0 && r > 0
      ? (100 * d) / (d + r)
      : null;
  return {
    ...forecast,
    result,
    actual,
    error: actual === null ? null : actual - forecast.share,
    correct: result?.calledParty ? result.calledParty === forecast.party : null,
  };
}

export function summarize(forecasts, snapshot, chamber) {
  const rows = forecasts
    .filter((r) => r.chamber === chamber)
    .map((r) => compareRace(r, snapshot?.races[r.id]));
  const called = rows.filter((r) => r.correct !== null);
  const scored = called.filter((r) => r.error !== null);
  const fixed = called.filter((r) => r.fixed);
  const count = (key, list) =>
    Object.fromEntries(
      ["DEM", "REP", "IND", "NOL", "OTHER", "Uncalled"].map((p) => [
        p,
        list.filter((r) => key(r) === p).length,
      ]),
    );
  return {
    rows,
    called: called.length,
    matched: called.filter((r) => r.correct).length,
    fixed: fixed.length,
    scored: scored.length,
    mae: scored.length
      ? scored.reduce((s, r) => s + Math.abs(r.error), 0) / scored.length
      : null,
    bias: scored.length
      ? scored.reduce((s, r) => s + r.error, 0) / scored.length
      : null,
    baselineMae: scored.length
      ? scored.reduce((s, r) => s + Math.abs(r.actual - r.baseline), 0) /
        scored.length
      : null,
    predicted: count((r) => r.party, rows),
    reported: count((r) => r.result?.calledParty || "Uncalled", rows),
    misses: called.filter((r) => !r.correct),
  };
}
