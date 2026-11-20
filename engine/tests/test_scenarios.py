"""The seven Phase 2 acceptance scenarios, plus determinism."""

import numpy as np

from baseline_engine.core import Rule, State, run

from .scenarios import build


def states(out, u=0):
    return [State(s) for s in out.state[u]]


def test_stable_person_ends_stable():
    out = run(build(n_users=400, seed=1))
    assert (out.state[:, -1] == State.STABLE).mean() >= 0.85
    # v0 (z = -1.645) is provisional; daily looks push false Reviews above the protocol limit.
    assert np.isfinite(out.first_review_day).mean() <= 0.12


def test_stricter_threshold_meets_false_referral_limit():
    from baseline_engine.config import DEFAULT_CONFIG

    out = run(build(n_users=1000, seed=21, days=365), DEFAULT_CONFIG.with_(watch_z=-2.33, rapid_z=-3.0))
    assert np.isfinite(out.first_review_day).mean() <= 0.03


def test_baseline_burst_is_building():
    out = run(build(seed=2))
    assert all(s == State.BUILDING for s in states(out)[:14])
    assert out.baseline.available.all()
    assert np.allclose(out.baseline.practice[0] > 0, True)


def test_sleep_dip_is_context_explained():
    dip = lambda d: 40 <= d < 44  # noqa: E731
    inp = build(n_users=100, seed=3, shift_sd=lambda d: -1.0 if dip(d) else 0.0, context={"poor_sleep": dip})
    out = run(inp)
    window = (inp.day[0] >= 40) & (inp.day[0] < 48)
    assert not (out.state[:, window] == State.REVIEW).any(axis=1).mean() > 0.05
    assert (out.state[:, window] == State.WATCH).any(axis=1).mean() <= 0.10
    assert (out.state[:, -1] == State.STABLE).mean() >= 0.85


def test_ramadan_shift_does_not_refer():
    fasting = lambda d: 60 <= d < 90  # noqa: E731
    inp = build(n_users=100, seed=4, shift_sd=lambda d: -0.4 if fasting(d) else 0.0, context={"fasting": fasting})
    out = run(inp)
    assert np.isfinite(out.first_review_day).mean() <= 0.08
    assert (out.state[:, -1] == State.STABLE).mean() >= 0.85


def test_slow_decline_reaches_review():
    onset = 30.0
    inp = build(n_users=100, seed=5, days=240, shift_sd=lambda d: -max(0.0, d - onset) / 60.0)
    out = run(inp)
    reached = np.isfinite(out.first_review_day)
    assert reached.mean() >= 0.9
    lead = out.first_review_day[reached] - onset
    assert np.median(lead) <= 150
    assert (out.first_watch_day[reached] <= out.first_review_day[reached]).all()


def test_sudden_drop_is_rapid_review():
    inp = build(n_users=100, seed=6, shift_sd=lambda d: -2.5 if d >= 60 else 0.0)
    out = run(inp)
    reached = np.isfinite(out.first_review_day)
    assert reached.mean() >= 0.95
    assert np.median(out.first_review_day[reached] - 60) <= 21
    first_review_rules = [
        Rule(out.rule[u, np.argmax(out.state[u] == State.REVIEW)]) for u in np.flatnonzero(reached)
    ]
    rapid = np.mean([r == Rule.RAPID_DROP for r in first_review_rules])
    assert rapid >= 0.7, rapid


def test_red_flag_is_urgent_and_bypasses_model():
    inp = build(seed=7)
    inp.red_flag[0, 5] = True
    inp.red_flag[0, 50] = True
    out = run(inp)
    assert out.state[0, 5] == State.URGENT and out.rule[0, 5] == Rule.RED_FLAG
    assert out.state[0, 50] == State.URGENT
    assert out.state[0, 51] != State.URGENT


def test_long_gap_carries_state_without_sessions():
    inp = build(seed=8, stop_after=60)
    out = run(inp)
    assert State(out.state[0, -1]) in (State.STABLE, State.WATCH_CONTEXT)


def test_deterministic():
    a = run(build(n_users=20, seed=9))
    b = run(build(n_users=20, seed=9))
    assert np.array_equal(a.state, b.state)
    assert np.array_equal(a.comp_z, b.comp_z, equal_nan=True)


def test_two_stage_gate_cuts_false_reviews():
    from baseline_engine.config import DEFAULT_CONFIG

    inp = build(n_users=300, seed=10, days=365)
    two = run(inp)
    one = run(inp, DEFAULT_CONFIG.with_(two_stage=False))
    assert np.isfinite(two.first_review_day).sum() < np.isfinite(one.first_review_day).sum()


def test_clinician_signoff_releases_review():
    inp = build(seed=11, shift_sd=lambda d: -2.5 if 60 <= d < 100 else 0.0)
    out = run(inp)
    assert np.isfinite(out.first_review_day[0])
    inp.signoff_day = np.array([110.0])
    released = run(inp)
    assert State(released.state[0, -1]) != State.REVIEW
