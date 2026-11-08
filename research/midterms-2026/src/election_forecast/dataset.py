"""Complete congressional roster and historical fundamentals for one pooled model."""

from __future__ import annotations

import csv
import json
import re

import numpy as np
import pandas as pd

from .data import aggregate_polls, election_day
from .context import incumbent_match, name_key, presidential_leans, terms_frame
from .data import CUTOFF, prepare_questions


def district_key(state, district):
    return f"{state}-{int(district):02d}" if int(district) else f"{state}-AL"


def district_leans(root, cycle):
    source_cycle = 2014 if cycle == 2012 else cycle
    path = root / f"data/reference/district-presidential-{source_cycle}.csv"
    lines = list(csv.reader(path.open(encoding="utf-8-sig")))
    # Only the previous presidential election enters each prediction year.
    columns = {
        2012: (5, 6, 2008),
        2014: (3, 4, 2012),
        2016: (5, 6, 2012),
        2018: (3, 4, 2016),
        2020: (5, 6, 2016),
        2022: (3, 4, 2020),
        2024: (6, 7, 2020),
        2026: (3, 4, 2024),
    }
    d, r, year = columns[cycle]
    rows = {}
    for line in lines:
        if line and re.fullmatch(r"[A-Z]{2}-(?:AL|\d{2})", line[0]):
            if not line[d] or not line[r]:
                rows[line[0]] = (np.nan, year)
                continue
            dv, rv = float(line[d]), float(line[r])
            rows[line[0]] = (100 * dv / (dv + rv), year)
    assert len(rows) == 435, (cycle, len(rows))
    return rows


def national_presidential(root):
    p = pd.read_csv(root / "data/raw/president.csv")
    p = p[p.party_simplified.isin(["DEMOCRAT", "REPUBLICAN"])]
    votes = p.groupby(["year", "party_simplified"]).candidatevotes.sum().unstack()
    return (100 * votes.DEMOCRAT / (votes.DEMOCRAT + votes.REPUBLICAN)).to_dict()


def historical_data(root):
    national = national_presidential(root)
    state_leans = presidential_leans(pd.read_csv(root / "data/raw/president.csv"))
    members = sum(
        [
            json.loads((root / f"data/raw/legislators-{kind}.json").read_text(encoding="utf-8"))
            for kind in ["historical", "current"]
        ],
        [],
    )
    terms = terms_frame(members)
    polls = pd.read_csv(root / "data/reference/historical-poll-features.csv")
    generic = polls.groupby("cycle").generic_dem_share.median().to_dict()
    poll_lookup = {}
    for row in polls.to_dict("records"):
        match = re.search(r"_([A-Z]{2})-(\d+|AL)$", row["race_id"])
        if row["chamber"] == "house" and not match:
            continue
        district = (0 if match.group(2) == "AL" else int(match.group(2))) if match else 0
        poll_lookup[(row["chamber"], row["cycle"], row["state"], district)] = row

    sources = {
        "house": pd.read_csv(root / "data/raw/full-coverage/house-history.csv", low_memory=False),
        "senate": pd.read_csv(root / "data/raw/senate.tsv", sep="\t"),
    }
    output = []
    for chamber, frame in sources.items():
        frame = frame[
            frame.year.between(2012 if chamber == "house" else 2000, 2024)
            & frame.stage.str.upper().eq("GEN")
            & frame["mode"].str.upper().eq("TOTAL")
            & ~frame.special.astype(str).str.lower().eq("true")
        ].copy()
        frame["party_group"] = (
            frame["party" if chamber == "house" else "party_simplified"]
            .fillna("")
            .map(
                lambda s: (
                    "DEM"
                    if re.search(r"DEMOCRAT", s, re.I)
                    else "REP"
                    if re.search(r"REPUBLICAN", s, re.I)
                    else "OTHER"
                )
            )
        )
        frame["district_id"] = pd.to_numeric(frame.district, errors="coerce").fillna(0).astype(int)
        # Fusion lines belong to the candidate's major party, including minor-party votes.
        candidate_keys = ["year", "state_po", "district_id", "candidate"]
        groups = frame.groupby(candidate_keys, dropna=False).party_group.transform(
            lambda s: "DEM" if "DEM" in set(s) else "REP" if "REP" in set(s) else "OTHER"
        )
        frame["party_group"] = groups
        for year, annual in frame.groupby("year"):
            leans = district_leans(root, year) if chamber == "house" else None
            previous = (
                state_leans[state_leans.year < year]
                .sort_values("year")
                .drop_duplicates("state_po", keep="last")
                .set_index("state_po")
            )
            cutoff = str(election_day(year))
            active = terms[
                (terms.chamber == chamber) & (terms.start <= cutoff) & (terms.end > cutoff)
            ]
            for (state, district), race in annual.groupby(["state_po", "district_id"]):
                if state == "DC":
                    continue
                votes = race.groupby("party_group").candidatevotes.sum()
                if min(votes.get("DEM", 0), votes.get("REP", 0)) <= 1:
                    continue
                label = district_key(state, district) if chamber == "house" else state
                if chamber == "house":
                    if label not in leans:
                        continue
                    prior_share, prior_year = leans[label]
                    if not np.isfinite(prior_share):
                        continue
                    lean = prior_share - national[prior_year]
                else:
                    lean, prior_year = previous.loc[state, ["state_presidential_lean", "year"]]
                flags = {}
                for party in ["DEM", "REP"]:
                    answers = [
                        incumbent_match(name, active[active.state.eq(state)])[0]
                        for name in race.loc[race.party_group.eq(party), "candidate"]
                        .dropna()
                        .unique()
                    ]
                    flags[f"{party.lower()}_incumbent"] = (
                        float(np.nanmax(answers)) if any(pd.notna(a) for a in answers) else np.nan
                    )
                poll = poll_lookup.get((chamber, year, state, district), {})
                output.append(
                    {
                        "race_id": f"{year}_{chamber}_{label}",
                        "label": label,
                        "cycle": int(year),
                        "chamber": chamber,
                        "state": state,
                        "district": district,
                        "partisan_lean": float(lean),
                        "presidential_source_year": int(prior_year),
                        "generic_dem_share": generic.get(year, np.nan),
                        "midterm": int(year % 4 == 2),
                        "president_party": 1
                        if year <= 2000 or 2010 <= year <= 2016 or year in [2022, 2024]
                        else -1,
                        "poll_dem_share": poll.get("poll_dem_share", np.nan),
                        **flags,
                        "dem_share": 100 * votes.DEM / (votes.DEM + votes.REP),
                    }
                )
    result = pd.DataFrame(output)
    assert not result.duplicated(["race_id"]).any()
    assert (result.presidential_source_year < result.cycle).all()
    return result


def corrected_roster(root):
    roster = pd.read_csv(root / "data/reference/nominees-2026.csv")
    corrections = []
    for i, row in roster.iterrows():
        # Some candidates run on several ballot lines: the original parser split
        # at the last comma and accidentally left a major party in the name.
        match = re.search(r",\s*(Democrat(?:ic)?|Republican)(?:,|$)", row.candidate)
        if match:
            party = "REP" if match.group(1) == "Republican" else "DEM"
            candidate = row.candidate[: match.start()].strip()
            corrections.append(
                {
                    "state": row.state,
                    "district": int(row.district),
                    "before": row.candidate,
                    "candidate": candidate,
                    "party": party,
                    "source_line": row.source_line,
                }
            )
            roster.loc[i, ["candidate", "party"]] = [candidate, party]
        if row.candidate.endswith(", Independent") and row.party_label == "Unenrolled":
            candidate = row.candidate.removesuffix(", Independent")
            roster.loc[i, "candidate"] = candidate
            corrections.append(
                {
                    "state": row.state,
                    "district": int(row.district),
                    "before": row.candidate,
                    "candidate": candidate,
                    "party": row.party,
                    "source_line": row.source_line,
                }
            )
    for col in ["special", "incumbent_marker"]:
        roster[col] = roster[col].astype(str).str.lower().eq("true")
    return roster, corrections


def ballot_party(candidates):
    """Keep a named minor party distinct from an independent candidacy."""
    if candidates.empty:
        return None
    if candidates.party.eq("DEM").all():
        return "DEM"
    if candidates.party.eq("REP").all():
        return "REP"
    labels = candidates.party_label.unique()
    if len(labels) != 1:
        return "OTHER"
    label = labels[0]
    if label in {
        "Independent",
        "Nonpartisan",
        "Unenrolled",
        "By Petition",
        "No Party",
        "No Party Affiliation",
    }:
        return "IND"
    return {"No Labels Party": "NOL", "Green": "GRN", "Libertarian": "LIB"}.get(label, label)


def candidate_matches(name, candidates):
    key = name_key(name)
    exact = [c for c in candidates if name_key(c) == key]
    if len(exact) == 1:
        return exact[0]
    tokens = key.split()
    compatible = [
        c
        for c in candidates
        if tokens and name_key(c).split()[-1] == tokens[-1] and name_key(c)[0] == key[0]
    ]
    return compatible[0] if len(compatible) == 1 else None


def eligible_raw_polls(root, chamber):
    p = pd.read_csv(root / f"data/raw/nyt-{chamber}-2026.csv")
    p = p[
        p.cycle.eq(2026)
        & p.stage.eq("general")
        & p.election_date.eq("2026-11-03")
        & p.state.ne("US")
    ].copy()
    for source, target in [("start_date", "start"), ("end_date", "end"), ("created_at", "created")]:
        p[target] = pd.to_datetime(p[source], format="mixed", errors="coerce")
    p = p[
        p.start.notna()
        & p.end.notna()
        & p.created.notna()
        & p.start.le(p.end)
        & p.end.le(CUTOFF)
        & p.created.dt.normalize().le(CUTOFF)
    ]
    p["polldate"] = (p.start + (p.end - p.start) / 2).dt.floor("D")
    p = p[p.polldate.ge(pd.Timestamp(CUTOFF) - pd.Timedelta(days=90))]
    for field in ["hypothetical", "ranked_choice_reallocated"]:
        p = p[~p[field].astype(str).str.lower().isin(["true", "1", "1.0"])]
    return p


def target_data(root):
    roster, corrections = corrected_roster(root)
    district = district_leans(root, 2026)
    national = national_presidential(root)
    state_leans = (
        presidential_leans(pd.read_csv(root / "data/raw/president.csv"))
        .query("year == 2024")
        .set_index("state_po")
    )
    generic_q = prepare_questions(pd.read_csv(root / "data/reference/generic-ballot-2026.csv"))
    generic = aggregate_polls(generic_q[generic_q.state.eq("US")], pd.Timestamp(CUTOFF))[
        "poll_dem_share"
    ]
    raw = {c: eligible_raw_polls(root, c) for c in ["house", "senate"]}
    rows, poll_audit = [], []
    for (chamber, state, seat, special), candidates in roster.groupby(
        ["chamber", "state", "district", "special"]
    ):
        label = district_key(state, seat) if chamber == "house" else state
        p = raw[chamber][raw[chamber].state.eq(state)].copy()
        if chamber == "house" and seat != 0:
            p = p[p.seat_number.eq(seat)]
        p["matched"] = p.candidate_name.map(
            lambda n: candidate_matches(n, candidates.candidate.tolist())
        )
        support = p[p.matched.notna()].groupby("matched").pct.mean()
        left = candidates[candidates.party.eq("DEM")]
        right = candidates[candidates.party.eq("REP")]
        others = candidates[candidates.party.eq("OTHER")]
        fixed = None
        kind = "D/R"
        if len(candidates.party.unique()) == 1 and candidates.party.iloc[0] in ["DEM", "REP"]:
            fixed = candidates.party.iloc[0]
            kind = "One party on ballot"
        # Identify a polled independent opposition without silently calling them D/R.
        elif left.empty and len(others):
            ranked = others.candidate.map(support).fillna(-1)
            left = others.loc[[ranked.idxmax()]]
            kind = "Independent transfer"
        elif right.empty and len(others):
            ranked = others.candidate.map(support).fillna(-1)
            right = others.loc[[ranked.idxmax()]]
            kind = "Independent transfer"
        # Alaska's polled independent can be the leading opposition despite a
        # Democrat also appearing on the ballot. Selection uses eligible polls.
        if chamber == "house" and state == "AK" and len(others):
            ranked = others.candidate.map(support).fillna(-1)
            dem_support = left.candidate.map(support).max()
            if ranked.max() > (dem_support if pd.notna(dem_support) else -1):
                left = others.loc[[ranked.idxmax()]]
                kind = "Independent transfer"
        if (state == "AK" or state == "ME") and fixed is None:
            kind += "; first-preference proxy"
        if state == "LA" and chamber == "house":
            kind = "Party aggregate; runoff possible"
        left_party, right_party = ballot_party(left), ballot_party(right)
        if "Independent transfer" in kind and any(
            party not in {None, "DEM", "REP", "IND"} for party in [left_party, right_party]
        ):
            kind = kind.replace("Independent transfer", "Minor-party transfer")
        left_names, right_names = left.candidate.tolist(), right.candidate.tolist()
        question_rows = []
        if fixed is None:
            for qid, q in p.groupby("question_id"):
                left_answers = q[q.matched.isin(left_names)].drop_duplicates(
                    ["candidate_id", "pct"]
                )
                right_answers = q[q.matched.isin(right_names)].drop_duplicates(
                    ["candidate_id", "pct"]
                )
                # Require all nominees in a party aggregate: do not conflate
                # one candidate's share with the complete party's share.
                if set(left_answers.matched) != set(left_names) or set(
                    right_answers.matched
                ) != set(right_names):
                    continue
                lv, rv = left_answers.pct.sum(), right_answers.pct.sum()
                if not (0 < lv + rv <= 101 and lv >= 0 and rv >= 0):
                    continue
                first = q.iloc[0]
                question_rows.append(
                    {
                        "poll_key": first.poll_id,
                        "pollster": first.pollster,
                        "polldate": first.polldate,
                        "samplesize": first.sample_size,
                        "poll_dem_share": 100 * lv / (lv + rv),
                    }
                )
                poll_audit.append(
                    {
                        "label": label,
                        "chamber": chamber,
                        "question_id": qid,
                        "left_candidates": " / ".join(left_names),
                        "right_candidates": " / ".join(right_names),
                    }
                )
        summary = (
            aggregate_polls(pd.DataFrame(question_rows), pd.Timestamp(CUTOFF))
            if question_rows
            else None
        )
        lean = (
            district[label][0] - national[2024]
            if chamber == "house"
            else state_leans.loc[state, "state_presidential_lean"]
        )
        rows.append(
            {
                "race_id": f"2026_{chamber}_{label}",
                "label": label,
                "chamber": chamber,
                "state": state,
                "district": int(seat),
                "special": bool(special),
                "cycle": 2026,
                "cutoff_date": CUTOFF,
                "partisan_lean": float(lean),
                "presidential_source_year": 2024,
                "generic_dem_share": generic,
                "midterm": 1,
                "president_party": -1,
                "dem_incumbent": int(left.incumbent_marker.any()),
                "rep_incumbent": int(right.incumbent_marker.any()),
                "left_candidate": " / ".join(left_names),
                "right_candidate": " / ".join(right_names),
                "left_party": left_party,
                "right_party": right_party,
                "poll_dem_share": summary["poll_dem_share"] if summary else np.nan,
                "poll_questions": len(question_rows),
                "fixed_party": fixed,
                "race_kind": kind,
                "input_basis": "Ballot composition"
                if fixed
                else "Polls + fundamentals"
                if summary
                else "Fundamentals",
            }
        )
    target = pd.DataFrame(rows)
    assert target.groupby("chamber").size().to_dict() == {"house": 435, "senate": 35}
    assert target[target.chamber.eq("house")].state.nunique() == 50
    assert not target.race_id.duplicated().any()
    return target, roster, corrections, pd.DataFrame(poll_audit)
