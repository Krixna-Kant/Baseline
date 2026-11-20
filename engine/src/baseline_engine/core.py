"""Vectorized change engine.

Arrays are shaped (U users, T slots[, F families | C context factors | K covariates]).
A slot is one session or one informant report; padding slots have ``day = NaN``.
The same code scores one app user (U = 1) and a 10,000-person simulated cohort.

Pipeline per family:
1. Fair layer: remove covariate offsets (assisted mode, phone, voice input).
2. Personal baseline: fit level + exponential practice gain on the first ``n_baseline``
   sessions; within-person SD shrunk toward a prior.
3. Residuals in personal SD units, context-adjusted (``adj``) and not (``raw``).
4. Local-level Kalman filter on residuals -> level, variance, reliable-change z.
5. Composite z across families; state machine with two-stage gate and hysteresis.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import IntEnum

import numpy as np

from .config import CONTEXT_FACTORS, COVARIATES, DEFAULT_CONFIG, FAMILIES, EngineConfig


class State(IntEnum):
    BUILDING = 0
    STABLE = 1
    WATCH_CONTEXT = 2
    WATCH = 3
    REVIEW = 4
    URGENT = 5


STATE_NAMES = {
    State.BUILDING: "building",
    State.STABLE: "stable",
    State.WATCH_CONTEXT: "watch_context",
    State.WATCH: "watch",
    State.REVIEW: "review",
    State.URGENT: "urgent",
}


class Rule(IntEnum):
    NO_SESSION = 0
    BASELINE_BUILDING = 1
    WITHIN_RANGE = 2
    CONTEXT_EXPLAINED_DROP = 3
    RC_COMPOSITE = 4
    RC_TWO_FAMILIES = 5
    RETEST_IN_PROGRESS = 6
    PERSIST_AFTER_RETEST = 7
    DECLINE_PLUS_INFORMANT = 8
    RAPID_DROP = 9
    ONE_STAGE_GATE = 10
    HYSTERESIS_HOLD = 11
    RECOVERED = 12
    REVIEW_HOLD = 13
    RED_FLAG = 14
    RETEST_CLEARED = 15
    SLOW_CHANGE = 16


RULE_NAMES = {r: r.name.lower() for r in Rule}


@dataclass
class EngineInput:
    day: np.ndarray  # (U, T) float, days since first slot; NaN = padding
    scores: np.ndarray  # (U, T, F) float, raw family scores (higher = better); NaN = missing
    context: np.ndarray  # (U, T, C) bool
    covariates: np.ndarray  # (U, T, K) bool
    informant_concern: np.ndarray  # (U, T) bool, informant reports new functional difficulty
    red_flag: np.ndarray  # (U, T) bool
    signoff_day: np.ndarray | None = None  # (U,) clinician closed the Review on this day; NaN = none
    prior_scale: np.ndarray | None = None  # (U,) multiplier on the prior within-person SD; None = 1

    @classmethod
    def empty(cls, n_users: int, n_slots: int) -> "EngineInput":
        u, t = n_users, n_slots
        return cls(
            day=np.full((u, t), np.nan),
            scores=np.full((u, t, len(FAMILIES)), np.nan),
            context=np.zeros((u, t, len(CONTEXT_FACTORS)), bool),
            covariates=np.zeros((u, t, len(COVARIATES)), bool),
            informant_concern=np.zeros((u, t), bool),
            red_flag=np.zeros((u, t), bool),
        )

    @property
    def shape(self) -> tuple[int, int]:
        return self.day.shape  # type: ignore[return-value]


@dataclass
class Baseline:
    level: np.ndarray  # (U, F) L, raw units
    practice: np.ndarray  # (U, F) A, raw units
    sd: np.ndarray  # (U, F) within-person SD, raw units
    n: np.ndarray  # (U, F) baseline observations used
    available: np.ndarray  # (U, F) bool
    end_slot: np.ndarray  # (U,) slot index of last baseline session; -1 if not reached


@dataclass
class EngineOutput:
    state: np.ndarray  # (U, T) int8, State
    rule: np.ndarray  # (U, T) int8, Rule
    observed: np.ndarray  # (U, T) bool
    level: np.ndarray  # (U, T, F) context-adjusted level, SD units; T = 0 when run with detail=False
    level_var: np.ndarray  # (U, T, F)
    fam_z: np.ndarray  # (U, T, F) context-adjusted reliable-change z
    fam_z_raw: np.ndarray  # (U, T, F)
    comp_level: np.ndarray  # (U, T)
    comp_se: np.ndarray  # (U, T)
    comp_z: np.ndarray  # (U, T)
    comp_z_raw: np.ndarray  # (U, T)
    context_level: np.ndarray  # (U, T)
    baseline: Baseline
    first_watch_day: np.ndarray  # (U,) NaN if never
    first_review_day: np.ndarray  # (U,)
    config: EngineConfig


def _prior_sd(cfg: EngineConfig) -> np.ndarray:
    return np.array([cfg.prior_sd[f] for f in FAMILIES])


def _covariate_offsets(inp: EngineInput, cfg: EngineConfig) -> np.ndarray:
    """(U, T, F) expected covariate effect in SD units."""
    eff = np.array([[cfg.covariate_effects[k][f] for f in FAMILIES] for k in COVARIATES])  # (K, F)
    return inp.covariates.astype(float) @ eff


def _context_offsets(inp: EngineInput, cfg: EngineConfig) -> np.ndarray:
    """(U, T, F) expected context effect in SD units (same for every family)."""
    beta = np.array([cfg.context_effects[c] for c in CONTEXT_FACTORS])  # (C,)
    total = inp.context.astype(float) @ beta  # (U, T)
    return np.repeat(total[:, :, None], len(FAMILIES), axis=2)


def fit_baseline(inp: EngineInput, cfg: EngineConfig = DEFAULT_CONFIG) -> tuple[Baseline, np.ndarray, np.ndarray]:
    """Fit the personal baseline. Returns (baseline, exposure k (U,T), covariate-adjusted scores)."""
    u, t = inp.shape
    sd0 = _prior_sd(cfg)
    observed = np.isfinite(inp.scores).any(axis=2)
    cum = np.cumsum(observed, axis=1)
    k = np.where(observed, cum - 1, np.nan)

    y = inp.scores.copy()
    if cfg.use_covariates:
        y = y - _covariate_offsets(inp, cfg) * sd0
    y_fit = y - _context_offsets(inp, cfg) * sd0 if cfg.use_context else y

    in_base = (observed & (cum <= cfg.n_baseline))[:, :, None] & np.isfinite(y_fit)
    x = np.where(in_base, 1.0 - np.exp(-np.nan_to_num(k)[:, :, None] / cfg.practice_tau), 0.0)
    yy = np.where(in_base, y_fit, 0.0)
    n = in_base.sum(axis=1).astype(float)  # (U, F)
    sx, sxx = x.sum(1), (x * x).sum(1)
    sy, sxy = yy.sum(1), (x * yy).sum(1)

    with np.errstate(divide="ignore", invalid="ignore"):
        if cfg.use_practice:
            det = n * sxx - sx * sx
            a = np.where(det > 1e-9, (n * sxy - sx * sy) / det, 0.0)
            a = np.clip(np.nan_to_num(a), 0.0, cfg.practice_max_sd * sd0)
        else:
            a = np.zeros_like(n)
        level = (sy - a * sx) / n
        resid = np.where(in_base, y_fit - level[:, None, :] - a[:, None, :] * x, 0.0)
        df = np.maximum(n - (2 if cfg.use_practice else 1), 0.0)
        ss = (resid**2).sum(1)
        scale = np.ones(u) if inp.prior_scale is None else np.asarray(inp.prior_scale, float)
        var = (ss + cfg.prior_df * (sd0[None, :] * scale[:, None]) ** 2) / (df + cfg.prior_df)

    end_slot = np.where(cum[:, -1] >= cfg.n_baseline, np.argmax(cum >= cfg.n_baseline, axis=1), -1)
    available = (n >= max(4, cfg.n_baseline // 2)) & (end_slot >= 0)[:, None]
    base = Baseline(
        level=np.where(available, level, np.nan),
        practice=np.where(available, a, np.nan),
        sd=np.where(available, np.sqrt(var), np.nan),
        n=n,
        available=available,
        end_slot=end_slot,
    )
    return base, k, y


def run(inp: EngineInput, cfg: EngineConfig = DEFAULT_CONFIG, detail: bool = True) -> EngineOutput:
    """Run the engine. ``detail=False`` skips per-family trajectories (cohort runs in the Lab)."""
    u, t = inp.shape
    f = len(FAMILIES)
    base, k, y = fit_baseline(inp, cfg)
    observed = np.isfinite(inp.scores).any(axis=2)

    expected = base.level[:, None, :] + base.practice[:, None, :] * (
        1.0 - np.exp(-np.nan_to_num(k)[:, :, None] / cfg.practice_tau)
    )
    with np.errstate(invalid="ignore"):
        e_raw = (y - expected) / base.sd[:, None, :]
    e_adj = e_raw - _context_offsets(inp, cfg) if cfg.use_context else e_raw
    e_raw = np.clip(e_raw, -cfg.winsor_z, cfg.winsor_z)
    e_adj = np.clip(e_adj, -cfg.winsor_z, cfg.winsor_z)

    v_base = np.where(base.available, cfg.baseline_var_factor / np.maximum(base.n, 1), np.nan)
    w_all = np.array([cfg.weights[name] for name in FAMILIES])
    w = np.where(base.available, w_all, 0.0)
    if cfg.reliability_weighting:
        with np.errstate(invalid="ignore", divide="ignore"):
            rel = (_prior_sd(cfg)[None, :] / base.sd) ** cfg.reliability_power
        w = np.where(base.available, w * np.nan_to_num(rel), 0.0)
    w = w / np.where(w.sum(1, keepdims=True) > 0, w.sum(1, keepdims=True), 1.0)  # (U, F)
    thr = np.full(u, cfg.watch_z)
    if cfg.noise_threshold_power:
        with np.errstate(invalid="ignore", divide="ignore"):
            quiet = np.nanmean(np.where(base.available, _prior_sd(cfg)[None, :] / base.sd, np.nan), axis=1)
        thr = cfg.watch_z * np.clip(np.nan_to_num(quiet, nan=1.0), 0.25, 4.0) ** cfg.noise_threshold_power

    # Filter state
    mu_raw = np.zeros((u, f))
    mu_adj = np.zeros((u, f))
    p = np.full((u, f), cfg.initial_level_var)
    last_day = np.full((u, f), np.nan)
    ctx_level = np.zeros(u)

    # State machine
    state = np.full(u, State.BUILDING, dtype=np.int8)
    watch_since = np.full(u, np.nan)
    r_sum = np.zeros(u)
    r_var = np.zeros(u)
    r_n = np.zeros(u)
    streak = np.zeros(u, dtype=np.int32)
    cusum = np.zeros(u)
    last_informant = np.full(u, np.nan)
    first_watch = np.full(u, np.nan)
    first_review = np.full(u, np.nan)

    out_state = np.zeros((u, t), np.int8)
    out_rule = np.zeros((u, t), np.int8)
    fam_shape = (u, t, f) if detail else (u, 0, f)
    out_level = np.full(fam_shape, np.nan)
    out_var = np.full(fam_shape, np.nan)
    out_fz = np.full(fam_shape, np.nan)
    out_fz_raw = np.full(fam_shape, np.nan)
    out_cl = np.full((u, t), np.nan)
    out_cse = np.full((u, t), np.nan)
    out_cz = np.full((u, t), np.nan)
    out_cz_raw = np.full((u, t), np.nan)
    out_ctx = np.full((u, t), np.nan)

    signoff = inp.signoff_day if inp.signoff_day is not None else np.full(u, np.nan)
    signed_off = np.zeros(u, bool)
    anchor_raw = np.zeros((u, f))
    anchor_adj = np.zeros((u, f))

    any_ctx = inp.context.any(axis=2)
    slot_idx = np.arange(t)

    for ti in range(t):
        day = inp.day[:, ti]
        obs = observed[:, ti]
        last_informant = np.where(inp.informant_concern[:, ti], day, last_informant)

        ctx_level = np.where(obs, (1 - cfg.context_smoothing) * ctx_level + cfg.context_smoothing * any_ctx[:, ti], ctx_level)

        # Clinician sign-off closes the Review and re-anchors: later change is measured from today's level.
        released = (state == State.REVIEW) & ~signed_off & (day >= signoff)
        if released.any():
            rel = released[:, None]
            anchor_raw = np.where(rel, anchor_raw + mu_raw, anchor_raw)
            anchor_adj = np.where(rel, anchor_adj + mu_adj, anchor_adj)
            mu_raw = np.where(rel, 0.0, mu_raw)
            mu_adj = np.where(rel, 0.0, mu_adj)
            p = np.where(rel, cfg.initial_level_var, p)
            state = np.where(released, State.STABLE, state).astype(np.int8)
            watch_since = np.where(released, np.nan, watch_since)
            streak = np.where(released, 0, streak)
            cusum = np.where(released, 0.0, cusum)
            signed_off |= released
        er = e_raw[:, ti] - anchor_raw
        ea = e_adj[:, ti] - anchor_adj

        active = obs & (base.end_slot >= 0) & (slot_idx[ti] > base.end_slot)
        if active.any():
            first = np.isnan(last_day)
            start_day = inp.day[np.arange(u), np.maximum(base.end_slot, 0)]
            dt = np.where(first, day[:, None] - start_day[:, None], day[:, None] - last_day)
            has = active[:, None] & np.isfinite(ea) & base.available
            p_pred = p + cfg.process_var_per_day * np.maximum(np.nan_to_num(dt), 0.0)
            gain = p_pred / (p_pred + 1.0)
            mu_raw = np.where(has, mu_raw + gain * (np.nan_to_num(er) - mu_raw), mu_raw)
            mu_adj = np.where(has, mu_adj + gain * (np.nan_to_num(ea) - mu_adj), mu_adj)
            p = np.where(has, (1 - gain) * p_pred, p)
            last_day = np.where(has, day[:, None], last_day)

        tot_var = p + v_base
        with np.errstate(invalid="ignore", divide="ignore"):
            fz = mu_adj / np.sqrt(tot_var)
            fz_raw = mu_raw / np.sqrt(tot_var)
            c_level = np.nansum(w * mu_adj, axis=1)
            c_se = np.sqrt(np.nansum(w**2 * tot_var, axis=1))
            cz = c_level / c_se
            cz_raw = np.nansum(w * mu_raw, axis=1) / c_se

        # ---- state machine (only on observed post-baseline slots) ----
        low_adj = (cz <= thr) | ((fz <= thr[:, None]).sum(1) >= 2)
        low_raw = (cz_raw <= thr) | ((fz_raw <= thr[:, None]).sum(1) >= 2)
        explained = cfg.use_context & (ctx_level >= cfg.context_explain_level)
        unexpl = low_adj & ~explained
        ctx_flag = (low_adj | low_raw) & ~unexpl
        in_range = ~(low_adj | low_raw)
        informant_recent = cfg.use_informant & ((day - last_informant) <= cfg.informant_window_days)
        rapid = (cz <= cfg.rapid_z) & ~explained & (np.isnan(watch_since) | ((day - watch_since) <= cfg.rapid_window_days))
        comp_rule = np.where(cz <= thr, Rule.RC_COMPOSITE, Rule.RC_TWO_FAMILIES)

        new_state = state.copy()
        rule = np.full(u, Rule.NO_SESSION, np.int8)
        building = obs & ~active
        new_state[building] = State.BUILDING
        rule[building] = Rule.BASELINE_BUILDING

        is_review = active & (state == State.REVIEW)
        rule[is_review] = Rule.REVIEW_HOLD
        go = active & ~is_review
        in_watch = go & (state == State.WATCH)
        streak = np.where(go & in_range, streak + 1, np.where(go, 0, streak))

        # Per-session composite residual (this session only)
        fw = np.where(np.isfinite(ea), w, 0.0)
        fws = fw.sum(1)
        with np.errstate(invalid="ignore", divide="ignore"):
            e_comp = np.nansum(fw * np.nan_to_num(ea), axis=1) / fws
            v_comp = (fw**2).sum(1) / fws**2
            x_std = e_comp / np.sqrt(v_comp)
        if cfg.slow_rule:
            step = go & (fws > 0) & np.isfinite(x_std)
            cusum = np.where(step, np.maximum(0.0, cusum - np.nan_to_num(x_std) - cfg.cusum_k), cusum)
        slow = cfg.slow_rule & go & (cusum >= cfg.cusum_h) & ~explained

        # Escalation straight to Review (any state except Review)
        esc_rapid = go & unexpl & rapid
        esc_inf = go & unexpl & ~rapid & informant_recent
        esc_one = go & unexpl & ~rapid & ~informant_recent & (not cfg.two_stage)
        esc_slow = slow & ~(esc_rapid | esc_inf | esc_one)
        escalated = esc_rapid | esc_inf | esc_one | esc_slow

        # Stage 2: the retest burst is judged on its own sessions only, so the evidence is independent
        # of the sessions that opened Watch.
        counted = in_watch & ~escalated & (fws > 0)
        r_sum = np.where(counted, r_sum + e_comp, r_sum)
        r_var = np.where(counted, r_var + v_comp, r_var)
        r_n = np.where(counted, r_n + 1, r_n)
        done = counted & (r_n >= cfg.retest_sessions)
        with np.errstate(invalid="ignore", divide="ignore"):
            z_retest = (r_sum / r_n) / np.sqrt(r_var / r_n**2 + np.nansum(w**2 * v_base, axis=1))
        persist = done & (z_retest <= thr) & ~explained
        inconclusive = done & ~persist & explained
        cleared = done & ~persist & ~explained
        retest_hold = counted & ~done
        r_reset = inconclusive | cleared | escalated
        r_sum, r_var, r_n = (np.where(r_reset, 0.0, a) for a in (r_sum, r_var, r_n))

        # Stage 1: open Watch
        entering = go & unexpl & ~escalated & ~in_watch
        r_sum, r_var, r_n = (np.where(entering, 0.0, a) for a in (r_sum, r_var, r_n))
        to_ctx = go & ctx_flag & ~in_watch
        ctx_state = go & (state == State.WATCH_CONTEXT) & ~entering & ~to_ctx
        ctx_exit = ctx_state & (streak >= cfg.exit_watch_sessions)
        ctx_hold = ctx_state & ~ctx_exit
        plain = go & in_range & ((state == State.STABLE) | (state == State.BUILDING))

        for mask, s, r in (
            (plain, State.STABLE, Rule.WITHIN_RANGE),
            (ctx_exit, State.STABLE, Rule.RECOVERED),
            (ctx_hold, State.WATCH_CONTEXT, Rule.HYSTERESIS_HOLD),
            (to_ctx, State.WATCH_CONTEXT, Rule.CONTEXT_EXPLAINED_DROP),
            (retest_hold | inconclusive, State.WATCH, Rule.RETEST_IN_PROGRESS),
            (cleared, State.STABLE, Rule.RETEST_CLEARED),
            (persist, State.REVIEW, Rule.PERSIST_AFTER_RETEST),
            (esc_rapid, State.REVIEW, Rule.RAPID_DROP),
            (esc_inf, State.REVIEW, Rule.DECLINE_PLUS_INFORMANT),
            (esc_one, State.REVIEW, Rule.ONE_STAGE_GATE),
            (esc_slow, State.REVIEW, Rule.SLOW_CHANGE),
        ):
            new_state[mask] = s
            rule[mask] = r
        new_state[entering] = State.WATCH
        rule[entering] = comp_rule[entering]
        watch_since = np.where(entering & np.isnan(watch_since), day, watch_since)
        watch_since = np.where(cleared | ctx_exit, np.nan, watch_since)

        state = new_state
        first_watch = np.where(np.isnan(first_watch) & (state == State.WATCH), day, first_watch)
        first_review = np.where(np.isnan(first_review) & (state == State.REVIEW), day, first_review)

        shown = np.where(inp.red_flag[:, ti], State.URGENT, state)
        out_state[:, ti] = shown
        out_rule[:, ti] = np.where(inp.red_flag[:, ti], Rule.RED_FLAG, rule)

        post = (base.end_slot >= 0) & (slot_idx[ti] > base.end_slot)
        keep = post[:, None] & base.available
        if detail:
            out_level[:, ti] = np.where(keep, mu_adj, np.nan)
            out_var[:, ti] = np.where(keep, tot_var, np.nan)
            out_fz[:, ti] = np.where(keep, fz, np.nan)
            out_fz_raw[:, ti] = np.where(keep, fz_raw, np.nan)
        out_cl[:, ti] = np.where(post, c_level, np.nan)
        out_cse[:, ti] = np.where(post, c_se, np.nan)
        out_cz[:, ti] = np.where(post, cz, np.nan)
        out_cz_raw[:, ti] = np.where(post, cz_raw, np.nan)
        out_ctx[:, ti] = ctx_level

    return EngineOutput(
        state=out_state,
        rule=out_rule,
        observed=observed,
        level=out_level,
        level_var=out_var,
        fam_z=out_fz,
        fam_z_raw=out_fz_raw,
        comp_level=out_cl,
        comp_se=out_cse,
        comp_z=out_cz,
        comp_z_raw=out_cz_raw,
        context_level=out_ctx,
        baseline=base,
        first_watch_day=first_watch,
        first_review_day=first_review,
        config=cfg,
    )
