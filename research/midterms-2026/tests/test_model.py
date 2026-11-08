from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from election_forecast.dataset import ballot_party, corrected_roster, district_leans
from election_forecast.model import run
from election_forecast.benchmark import FAMILIES, design, evaluate, summarize, fit

ROOT = Path(__file__).resolve().parents[1]


def test_forecast_reproduces_reviewed_results():
    expected = pd.read_csv(ROOT / "results/2026-estimates.csv")
    actual = pd.read_csv(ROOT / "reports/2026-estimates.csv")
    pd.testing.assert_frame_equal(actual, expected, check_exact=False, rtol=1e-9, atol=1e-9)


def test_benchmark_reproduces_published_comparison():
    expected = pd.read_csv(ROOT / "results/benchmark/leaderboard.csv")
    actual = pd.read_csv(ROOT / "reports/benchmark/leaderboard.csv")
    pd.testing.assert_frame_equal(actual, expected, check_exact=False, rtol=1e-6, atol=1e-6)
    predictions = pd.read_csv(ROOT / "reports/benchmark/predictions.csv")
    assert (predictions.trained_through < predictions.cycle).all()
    assert (
        predictions.groupby(["cycle", "family"])
        .race_id.nunique()
        .groupby("cycle")
        .nunique()
        .eq(1)
        .all()
    )


def test_roster_covers_the_actual_ballot_and_fusion_parties():
    roster, fixes = corrected_roster(ROOT)
    assert roster.groupby("chamber").apply(
        lambda g: g[["state", "district", "special"]].drop_duplicates().shape[0],
        include_groups=False,
    ).to_dict() == {"house": 435, "senate": 35}
    assert len(fixes) == 29
    ny = roster[roster.state.eq("NY") & roster.district.eq(7)]
    assert ny.set_index("candidate").loc["Claire Valdez", "party"] == "DEM"
    assert ny.set_index("candidate").loc["Melvin Rivera", "party"] == "REP"
    assert "Nadia Donya Milleron" in roster.candidate.values
    assert not roster.candidate.str.endswith(", Independent").any()
    aversa = roster[roster.candidate.eq("Alan Aversa")]
    assert ballot_party(aversa) == "NOL"


def test_full_outputs_keep_unpolled_special_independent_and_fixed_races():
    f = pd.read_csv(ROOT / "reports/2026-estimates.csv")
    assert len(f) == 470 and f.race_id.is_unique
    assert f[f.chamber.eq("house")].state.nunique() == 50
    assert f.projected_party.notna().all()
    assert f.set_index("label").loc["AZ-03", "right_party"] == "NOL"
    s = f[f.chamber.eq("senate")].set_index("state")
    assert s.loc[["FL", "OH"], "special"].all()
    assert s.loc[["AK", "ME", "LA", "NE", "ID"], "prediction"].notna().all()
    unpolled = f[f.input_basis.eq("Fundamentals")]
    assert unpolled.prediction.notna().all() and unpolled.poll_dem_share.isna().all()
    assert s.loc["NE", "left_party"] == "IND"
    assert pd.isna(s.loc["NE", "p_dem_two_party_majority"])
    fixed = f[f.fixed_party.notna()]
    assert fixed.prediction.isna().all()
    assert (fixed.projected_party == fixed.fixed_party).all()


def test_presidential_inputs_precede_each_prediction_cycle():
    for cycle in range(2012, 2027, 2):
        leans = district_leans(ROOT, cycle)
        assert len(leans) == 435
        assert all(year < cycle for _, year in leans.values())
    history = pd.read_csv(ROOT / "reports/training-data.csv")
    assert (history.presidential_source_year < history.cycle).all()
    assert history.cycle.max() == 2024


def test_no_poll_design_cannot_see_hidden_poll_values():
    h = pd.read_csv(ROOT / "reports/training-data.csv").head(30)
    original = design(h, mask_polls=True)
    h["poll_dem_share"] = np.arange(len(h)) * 99
    pd.testing.assert_frame_equal(original, design(h, mask_polls=True))
    assert original.poll_deviation.eq(0).all()
    assert original.has_poll.eq(0).all()


def test_current_year_labels_cannot_change_its_forecast_or_settings():
    h = pd.read_csv(ROOT / "reports/training-data.csv")
    t = pd.read_csv(ROOT / "reports/2026-feature-snapshots.csv").head(5)
    # A stratified sample keeps the full temporal boundary while making the test fast.
    h = h.groupby(["chamber", "cycle"], group_keys=False).head(35).copy()
    families = {k: FAMILIES[k] for k in ["baseline", "poll_blend", "residual_ridge"]}
    before, before_scores = evaluate(h, families, progress=False)
    before_policy = summarize(before, before_scores, families)[3]
    h.loc[h.cycle.eq(2024), "dem_share"] += 7
    after, after_scores = evaluate(h, families, progress=False)
    after_policy = summarize(after, after_scores, families)[3]
    cols = ["race_id", "family", "prediction", "params", "trained_through"]
    pd.testing.assert_frame_equal(
        before.loc[before.cycle.eq(2024), cols].reset_index(drop=True),
        after.loc[after.cycle.eq(2024), cols].reset_index(drop=True),
    )
    pd.testing.assert_frame_equal(
        before_policy.loc[before_policy.cycle.eq(2024), cols].reset_index(drop=True),
        after_policy.loc[after_policy.cycle.eq(2024), cols].reset_index(drop=True),
    )
    assert (before.trained_through < before.cycle).all()
    with pytest.raises(AssertionError):
        run(h, t.assign(dem_share=99))


def test_selected_blend_fallback_is_independent_of_hidden_polls():
    h = pd.read_csv(ROOT / "reports/training-data.csv").head(30)
    model = fit(h, "poll_blend", {"poll_weight": 0.75})
    masked = model.predict(h, mask_polls=True)
    h["poll_dem_share"] = np.arange(len(h)) * 99
    np.testing.assert_array_equal(masked, model.predict(h, mask_polls=True))
    h["poll_dem_share"] = np.nan
    np.testing.assert_array_equal(masked, model.predict(h))
