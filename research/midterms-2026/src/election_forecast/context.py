"""Historical incumbency and partisan context."""

import re
import unicodedata
import numpy as np
import pandas as pd


def name_key(name):
    text = unicodedata.normalize("NFKD", str(name)).encode("ascii", "ignore").decode().lower()
    text = re.sub(r"\b(jr|sr|ii|iii|iv)\b\.?", "", text)
    return " ".join(re.findall(r"[a-z]+", text))


def last_key(name):
    tokens = name_key(name).split()
    return tokens[-1] if tokens else ""


def terms_frame(members):
    rows = []
    for member in members:
        names = [member["name"], *member.get("other_names", [])]
        aliases = set()
        for name in names:
            for first in (name.get("first"), name.get("nickname")):
                if first and name.get("last"):
                    aliases.add(name_key(first + " " + name["last"]))
            if name.get("official_full"):
                aliases.add(name_key(name["official_full"]))
        for term in member["terms"]:
            if term["type"] not in ("sen", "rep") or str(term["end"]) < "1998":
                continue
            rows.append(
                {
                    "member_id": member["id"]["bioguide"],
                    "state": term["state"],
                    "chamber": {"sen": "senate", "rep": "house"}[term["type"]],
                    "start": str(term["start"]),
                    "end": str(term["end"]),
                    "aliases": aliases,
                    "last": last_key(member["name"]["last"]),
                }
            )
    return pd.DataFrame(rows).drop_duplicates(["member_id", "state", "chamber", "start", "end"])


def incumbent_match(candidate, active):
    """Exact name or unique surname + compatible first initial; ambiguity stays NA."""
    key = name_key(candidate)
    if not key:
        return np.nan, "missing_candidate", None
    if active.empty:
        return np.nan, "no_active_service_records", None
    exact = active.loc[active.aliases.map(lambda aliases: key in aliases).astype(bool)]
    if exact.member_id.nunique() == 1:
        return 1.0, "exact", exact.member_id.iloc[0]
    surname = active[active["last"] == last_key(candidate)]
    if surname.empty:
        return 0.0, "no_serving_surname_match", None
    compatible = surname[surname.aliases.map(lambda aliases: any(a[0] == key[0] for a in aliases))]
    if compatible.member_id.nunique() == 1:
        return 1.0, "surname_initial", compatible.member_id.iloc[0]
    return np.nan, "ambiguous_name", None


def presidential_leans(results):
    rows = results[results.party_simplified.isin(["DEMOCRAT", "REPUBLICAN"])].copy()
    rows["candidatevotes"] = pd.to_numeric(rows.candidatevotes, errors="raise")
    votes = rows.groupby(["year", "state_po", "party_simplified"]).candidatevotes.sum().unstack()
    national = votes.groupby("year").sum()
    national_share = 100 * national.DEMOCRAT / (national.DEMOCRAT + national.REPUBLICAN)
    votes["state_presidential_lean"] = 100 * votes.DEMOCRAT / (
        votes.DEMOCRAT + votes.REPUBLICAN
    ) - votes.index.get_level_values("year").map(national_share)
    return votes.reset_index()[["year", "state_po", "state_presidential_lean"]]
