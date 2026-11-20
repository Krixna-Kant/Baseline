"""A5 levers: slow-change rule, noise-aware threshold, reliability weighting, per-person prior scale."""

import numpy as np

from baseline_engine.config import DEFAULT_CONFIG
from baseline_engine.core import Rule, run

from .scenarios import SD, build

SLOW = DEFAULT_CONFIG.with_(slow_rule=True, cusum_k=1.0, cusum_h=10.0)


def test_levers_off_by_default():
    assert not DEFAULT_CONFIG.slow_rule
    assert not DEFAULT_CONFIG.reliability_weighting
    assert DEFAULT_CONFIG.noise_threshold_power == 0.0


def test_slow_change_rule_fires_on_steady_drift_only_when_enabled():
    inp = build(n_users=200, seed=31, days=240, shift_sd=lambda d: -max(0.0, d - 20) / 120)
    off = run(inp, DEFAULT_CONFIG, detail=False)
    on = run(inp, SLOW, detail=False)
    assert not (off.rule == Rule.SLOW_CHANGE).any()
    assert (on.rule == Rule.SLOW_CHANGE).any()
    assert np.isfinite(on.first_review_day).mean() >= np.isfinite(off.first_review_day).mean()
    both = np.isfinite(on.first_review_day) & np.isfinite(off.first_review_day)
    assert (on.first_review_day[both] <= off.first_review_day[both]).all()


def test_slow_change_rule_stays_quiet_for_stable_people():
    out = run(build(n_users=1000, seed=32, days=365), SLOW, detail=False)
    assert (out.rule == Rule.SLOW_CHANGE).any(axis=1).mean() <= 0.02


def test_noise_aware_threshold_helps_noisier_people_only():
    inp = build(n_users=400, seed=33, days=150, shift_sd=lambda d: -0.9 if d > 60 else 0.0)
    extra = np.random.default_rng(1).standard_normal(inp.scores.shape) * SD * 1.2
    inp.scores = inp.scores + np.where(np.arange(400)[:, None, None] < 200, extra, 0.0)
    base = run(inp, DEFAULT_CONFIG, detail=False)
    relaxed = run(inp, DEFAULT_CONFIG.with_(noise_threshold_power=1.0), detail=False)
    hit = lambda o, s: np.isfinite(o.first_review_day[s]).mean()  # noqa: E731
    noisy, quiet = slice(0, 200), slice(200, 400)
    assert hit(relaxed, noisy) > hit(base, noisy) + 0.05
    assert abs(hit(relaxed, quiet) - hit(base, quiet)) < abs(hit(relaxed, noisy) - hit(base, noisy))


def test_prior_scale_and_reliability_weighting_run():
    inp = build(n_users=50, seed=34)
    inp.prior_scale = np.full(50, 1.3)
    out = run(inp, DEFAULT_CONFIG.with_(reliability_weighting=True))
    assert np.isfinite(out.baseline.sd).all()
    plain = run(build(n_users=50, seed=34))
    assert (out.baseline.sd >= plain.baseline.sd - 1e-12).all()
