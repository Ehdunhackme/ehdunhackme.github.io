"""Polling aggregation and cutoff handling."""

from datetime import date, timedelta
import numpy as np
import pandas as pd

CUTOFF = "2026-11-02"


def election_day(year: int) -> date:
    first = date(year, 11, 1)
    first_monday = first + timedelta(days=(0 - first.weekday()) % 7)
    return first_monday + timedelta(days=1)


def aggregate_polls(
    rows: pd.DataFrame, cutoff: pd.Timestamp, lookback=90, half_life=14
) -> dict | None:
    """Field-date proxy only: this function does not establish publication time."""
    eligible = rows[
        (rows["polldate"] <= cutoff) & (rows["polldate"] >= cutoff - pd.Timedelta(days=lookback))
    ]
    if eligible.empty:
        return None
    surveys = (
        eligible.groupby(["poll_key", "pollster"], dropna=False)
        .agg(
            poll_dem_share=("poll_dem_share", "mean"),
            polldate=("polldate", "max"),
            samplesize=("samplesize", "max"),
        )
        .reset_index()
    )
    ages = (cutoff - surveys["polldate"]).dt.days.to_numpy()
    # The archive itself imputes sample sizes. Any remaining missing size gets
    # no size advantage; this is a fixed weighting rule, not an outcome estimate.
    sizes = surveys["samplesize"].fillna(100).clip(100, 3000).to_numpy()
    surveys["weight"] = np.exp2(-ages / half_life) * np.sqrt(sizes)
    # Cap repeated pollsters at their strongest survey weight.
    numerator = surveys.assign(weighted=surveys["weight"] * surveys["poll_dem_share"])
    pollsters = numerator.groupby("pollster", dropna=False).agg(
        numerator=("weighted", "sum"), denominator=("weight", "sum"), weight=("weight", "max")
    )
    shares = pollsters["numerator"] / pollsters["denominator"]
    mean = np.average(shares, weights=pollsters["weight"])
    return {
        "poll_dem_share": mean,
        "poll_spread": float(
            np.sqrt(np.average((shares - mean) ** 2, weights=pollsters["weight"]))
        ),
        "log_poll_count": float(np.log1p(len(surveys))),
        "log_pollster_count": float(np.log1p(len(pollsters))),
        "days_since_poll": int(ages.min()),
        "log_sample_size": float(np.log1p(np.median(sizes))),
    }


def database_date_eligible(questions, cutoff, delay_days=0):
    """Day-level sensitivity only: source timezone and release dates are unverified."""
    date = pd.Timestamp(cutoff).tz_localize(None).normalize()
    database_limit = date - pd.Timedelta(days=delay_days)
    return questions[
        (questions.end_date <= date)
        & (questions.database_created_at_naive.dt.normalize() <= database_limit)
        & (questions.end_date >= date - pd.Timedelta(days=90))
    ].copy()


def prepare_questions(frame, cutoff=CUTOFF):
    """Conservative field-end/database-date eligibility; still a time proxy."""
    q = frame.copy()
    for col in ["start_date", "end_date", "database_created_at_naive"]:
        q[col] = pd.to_datetime(q[col], errors="raise")
    q = q[q.start_date.notna() & q.end_date.notna() & (q.start_date <= q.end_date)]
    q = database_date_eligible(q, cutoff)
    q["polldate"] = (q.start_date + (q.end_date - q.start_date) / 2).dt.floor("D")
    return q[q.polldate >= pd.Timestamp(cutoff) - pd.Timedelta(days=90)].copy()
