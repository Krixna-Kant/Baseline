"""Protocol section 4 metric definitions (with amendments A2 and A3)."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from baseline_engine.core import EngineOutput

from .generator import Cohort

YEAR = 365.0
SEGMENT_VARS = ["language", "age_band", "education", "familiarity", "sex"]
FAIRNESS_VARS = ["language", "age_band", "education", "familiarity"]
MIN_GROUP_USERS = 200
MIN_GROUP_DECLINERS = 50


@dataclass
class UserOutcomes:
    """Per-user indicator columns; every protocol metric is a ratio of sums over users."""

    frame: pd.DataFrame


def user_outcomes(c: Cohort, out: EngineOutput) -> pd.DataFrame:
    review = out.first_review_day
    onset = c.onset_day
    d = c.is_decliner
    end = c.end_day
    b0 = c.baseline_end_day

    last_session = np.where(c.completed.any(1), np.nanmax(np.where(c.completed, c.inp.day, np.nan), axis=1), b0)
    follow_end = np.minimum(end, np.nan_to_num(c.people["dropout_day"].to_numpy(), nan=end))
    person_years = np.clip(follow_end - b0, 0, None) / YEAR

    has_review = np.isfinite(review)
    eligible_sens = d & (onset <= end - YEAR)
    detected = eligible_sens & has_review & (review >= onset) & (review <= onset + YEAR)
    false_review = has_review & (~d | (review < np.nan_to_num(onset, nan=np.inf)))
    true_review = has_review & ~false_review
    spec_eligible = ~d
    spec_ok = spec_eligible & ~(has_review & (review <= b0 + YEAR))
    lead = np.where(detected, review - onset, np.nan)

    n_sched = c.scheduled.sum(1)
    n_done = c.completed.sum(1)
    nb = c.params["baseline_sessions"]

    df = c.people.copy()
    df["eligible_sens"] = eligible_sens.astype(float)
    df["detected"] = detected.astype(float)
    df["spec_eligible"] = spec_eligible.astype(float)
    df["spec_ok"] = spec_ok.astype(float)
    df["false_review"] = false_review.astype(float)
    df["true_review"] = true_review.astype(float)
    df["any_review"] = has_review.astype(float)
    df["person_years"] = person_years
    df["lead_days"] = lead
    df["review_day"] = review
    df["watch_day"] = out.first_watch_day
    df["sessions_scheduled"] = n_sched.astype(float)
    df["sessions_done"] = n_done.astype(float)
    df["baseline_done"] = c.completed[:, :nb].sum(1).astype(float)
    df["baseline_scheduled"] = float(nb)
    df["dropped_out"] = (last_session < end - 60).astype(float)
    df["one"] = 1.0
    return df


RATIOS: dict[str, tuple[str, str, float]] = {
    # name: (numerator column, denominator column, scale)
    "sensitivity_12m": ("detected", "eligible_sens", 1.0),
    "specificity_12m": ("spec_ok", "spec_eligible", 1.0),
    "false_reviews_per_1000_py": ("false_review", "person_years", 1000.0),
    "ppv": ("true_review", "any_review", 1.0),
    "completion": ("sessions_done", "sessions_scheduled", 1.0),
    "baseline_completion": ("baseline_done", "baseline_scheduled", 1.0),
    "dropout": ("dropped_out", "one", 1.0),
}


def point(df: pd.DataFrame, name: str) -> float:
    num, den, scale = RATIOS[name]
    d = df[den].sum()
    return float(df[num].sum() / d * scale) if d > 0 else float("nan")


class Bootstrap:
    """Multinomial resampling of users (A2 item 7). Segment metrics reuse the same resamples."""

    def __init__(self, n_users: int, n_boot: int = 1000, seed: int = 7):
        rng = np.random.default_rng(seed)
        self.w = rng.multinomial(n_users, np.full(n_users, 1.0 / n_users), size=n_boot).astype(np.float32)

    def ratio_ci(self, df: pd.DataFrame, name: str, mask: np.ndarray | None = None) -> tuple[float, float]:
        num, den, scale = RATIOS[name]
        x = df[num].to_numpy(np.float32)
        y = df[den].to_numpy(np.float32)
        w = self.w if mask is None else self.w[:, mask]
        if mask is not None:
            x, y = x[mask], y[mask]
        with np.errstate(invalid="ignore", divide="ignore"):
            r = (w @ x) / (w @ y) * scale
        r = r[np.isfinite(r)]
        if len(r) == 0:
            return float("nan"), float("nan")
        lo, hi = np.percentile(r, [2.5, 97.5])
        return float(lo), float(hi)

    def median_ci(self, values: np.ndarray, mask: np.ndarray, n: int = 300) -> tuple[float, float]:
        """Median lead time; resamples users with the first ``n`` weight rows (medians are not ratios)."""
        v = values[mask]
        w = self.w[:n, mask]
        meds = []
        for row in w:
            reps = np.repeat(v, row.astype(int))
            if len(reps):
                meds.append(np.median(reps))
        if not meds:
            return float("nan"), float("nan")
        lo, hi = np.percentile(meds, [2.5, 97.5])
        return float(lo), float(hi)


def with_ci(df: pd.DataFrame, boot: Bootstrap, name: str, mask: np.ndarray | None = None) -> dict:
    sub = df if mask is None else df[mask]
    lo, hi = boot.ratio_ci(df, name, mask)
    return {"est": point(sub, name), "lo": lo, "hi": hi}


def summary(df: pd.DataFrame, boot: Bootstrap | None = None, mask: np.ndarray | None = None) -> dict:
    sub = df if mask is None else df[mask]
    res: dict = {}
    for name in RATIOS:
        res[name] = with_ci(df, boot, name, mask) if boot is not None else {"est": point(sub, name)}
    lead = sub["lead_days"].dropna()
    res["lead_days_median"] = {"est": float(lead.median()) if len(lead) else float("nan")}
    if boot is not None and len(lead):
        m = np.isfinite(df["lead_days"].to_numpy()) & (np.ones(len(df), bool) if mask is None else mask)
        lo, hi = boot.median_ci(df["lead_days"].to_numpy(), m)
        res["lead_days_median"].update(lo=lo, hi=hi)
    res["n_users"] = int(len(sub))
    res["n_eligible_decliners"] = int(sub["eligible_sens"].sum())
    return res


def segments(df: pd.DataFrame, boot: Bootstrap | None = None) -> dict:
    out: dict = {}
    for var in SEGMENT_VARS:
        out[var] = {}
        for level in sorted(df[var].unique()):
            m = (df[var] == level).to_numpy()
            s = summary(df, boot, m)
            s["low_n"] = s["n_users"] < MIN_GROUP_USERS
            s["low_n_decliners"] = s["n_eligible_decliners"] < MIN_GROUP_DECLINERS
            out[var][str(level)] = s
    return out


def fairness(df: pd.DataFrame) -> dict:
    """Section 5.2 constraints with A3 group rules: sensitivity gap and smoothed false-referral ratio."""
    res: dict = {}
    for var in FAIRNESS_VARS:
        sens, rates, excluded = {}, {}, []
        for level, g in df.groupby(var):
            if len(g) < MIN_GROUP_USERS:
                excluded.append(str(level))
                continue
            py = g["person_years"].sum()
            rates[str(level)] = (g["false_review"].sum() + 0.5) / py * 1000 if py > 0 else np.nan
            if g["eligible_sens"].sum() >= MIN_GROUP_DECLINERS:
                sens[str(level)] = g["detected"].sum() / g["eligible_sens"].sum()
            else:
                excluded.append(f"{level} (sensitivity)")
        gap = max(sens.values()) - min(sens.values()) if len(sens) >= 2 else 0.0
        r = [v for v in rates.values() if np.isfinite(v)]
        ratio = max(r) / min(r) if len(r) >= 2 else 1.0
        res[var] = {
            "sensitivity_gap": float(gap),
            "false_ratio": float(ratio),
            "sensitivity_by_group": {k: float(v) for k, v in sens.items()},
            "false_rate_by_group": {k: float(v) for k, v in rates.items()},
            "excluded": excluded,
            "worst_sens_groups": [min(sens, key=sens.get), max(sens, key=sens.get)] if len(sens) >= 2 else [],
            "worst_false_groups": [max(rates, key=rates.get), min(rates, key=rates.get)] if len(rates) >= 2 else [],
        }
    return res


def icc_2_1(x: np.ndarray) -> float:
    """ICC(2,1), two-way random effects, absolute agreement, single measure (Shrout and Fleiss)."""
    x = x[np.isfinite(x).all(1)]
    n, k = x.shape
    if n < 3:
        return float("nan")
    gm = x.mean()
    msr = k * ((x.mean(1) - gm) ** 2).sum() / (n - 1)
    msc = n * ((x.mean(0) - gm) ** 2).sum() / (k - 1)
    sse = ((x - x.mean(1, keepdims=True) - x.mean(0, keepdims=True) + gm) ** 2).sum()
    mse = sse / ((n - 1) * (k - 1))
    return float((msr - mse) / (msr + (k - 1) * mse + k * (msc - mse) / n))


def reliability(c: Cohort, boot: Bootstrap, n_boot: int = 1000) -> dict:
    """Test-retest among Stable users (protocol 4, A3 item 4)."""
    stable = (c.people["trajectory"] == "stable").to_numpy()
    s = np.where(c.completed[:, :, None], c.inp.scores, np.nan)
    nb = c.params["baseline_sessions"]
    day = c.inp.day[0]
    b0 = c.baseline_end_day

    base_means = np.nanmean(s[stable, :nb], axis=1)
    scale = np.nanstd(base_means, axis=0)
    centre = np.nanmean(base_means, axis=0)
    z = (s - centre) / scale
    comp = np.nanmean(z, axis=2)

    def block(arr: np.ndarray, sel: np.ndarray) -> np.ndarray:
        with np.errstate(invalid="ignore"):
            return np.nanmean(arr[:, sel], axis=1) if arr.ndim == 2 else np.nanmean(arr[:, sel, :], axis=1)

    half1, half2 = np.arange(t := len(day)) < nb // 2, (np.arange(t) >= nb // 2) & (np.arange(t) < nb)
    if c.arm == "daily":
        p1 = (day >= b0) & (day < b0 + 14)
        p2 = (day >= b0 + 14) & (day < b0 + 28)
    else:
        bursts = np.unique(np.floor((day[nb:] - b0) / c.params["burst_arm"]["every_days"]))
        first = (day >= b0) & (np.floor((day - b0) / c.params["burst_arm"]["every_days"]) == bursts[0])
        second = (day >= b0) & (np.floor((day - b0) / c.params["burst_arm"]["every_days"]) == bursts[1])
        p1, p2 = first, second
    pairs = {"baseline_halves": (half1, half2), "consecutive_blocks": (p1, p2)}

    idx = np.flatnonzero(stable)
    rng = np.random.default_rng(11)
    res: dict = {}
    for pname, (a_sel, b_sel) in pairs.items():
        res[pname] = {}
        for fname, arr in (("composite", comp), ("memory", z[:, :, 0]), ("speed", z[:, :, 1]), ("executive", z[:, :, 2])):
            x = np.column_stack([block(arr, a_sel), block(arr, b_sel)])[stable]
            est = icc_2_1(x)
            boots = [icc_2_1(x[rng.integers(0, len(x), len(x))]) for _ in range(n_boot)]
            lo, hi = np.nanpercentile(boots, [2.5, 97.5])
            ok = np.isfinite(x).all(1)
            diff = x[ok, 1] - x[ok, 0]
            res[pname][fname] = {
                "icc": est,
                "lo": float(lo),
                "hi": float(hi),
                "bland_altman_bias": float(diff.mean()),
                "loa_low": float(diff.mean() - 1.96 * diff.std(ddof=1)),
                "loa_high": float(diff.mean() + 1.96 * diff.std(ddof=1)),
                "n": int(ok.sum()),
            }
    res["n_stable_users"] = int(len(idx))
    return res
