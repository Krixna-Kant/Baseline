"""Synthetic cohort generator (protocol section 3, amendments A1 and A2).

Deliberately a different model from the detector in ``baseline_engine.core``:
- session noise is Student-t (detector assumes Gaussian), larger for low familiarity, age 75+, low education;
- practice curves are exponential, power or absent with person-specific size and speed (detector: one exponential);
- scores come from item-level responses with floor and ceiling (detector: continuous scores);
- true context and covariate effects differ from the detector's assumed sizes, and context is not always reported;
- missed sessions and drop-out become more likely as true change grows;
- informants report from true change with low early-change accuracy (A1);
- a few items are planted as harder for one language or education group (DIF).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from importlib import resources
from typing import Any

import numpy as np
import pandas as pd
import yaml

from baseline_engine.config import CONTEXT_FACTORS, COVARIATES, FAMILIES
from baseline_engine.core import EngineInput

AGE_BANDS = ["<50", "50-64", "65-74", "75+"]
EDUCATION = ["none_primary", "secondary", "tertiary"]
FAMILIARITY = ["low", "medium", "high"]
LANGUAGES = ["ar", "en"]
CLASSES = ["stable", "ageing_drift", "slow", "accelerating", "step", "transient"]
DECLINE_CLASSES = {"slow", "accelerating", "step"}
COPRIME_30 = np.array([1, 7, 11, 13, 17, 19, 23, 29])
COPRIME_15 = np.array([1, 2, 4, 7, 8, 11, 13, 14])


def load_params() -> dict[str, Any]:
    text = resources.files("baseline_lab").joinpath("params.yaml").read_text(encoding="utf-8")
    return yaml.safe_load(text)


@dataclass
class ItemData:
    """Baseline-burst item responses for DIF analysis."""

    shopping_items: np.ndarray  # (U, S, n_targets) int item ids
    shopping_hits: np.ndarray  # (U, S, n_targets) bool
    med_items: np.ndarray  # (U, S, rows)
    med_correct: np.ndarray  # (U, S, rows) bool
    shopping_dif: np.ndarray  # planted item ids
    med_dif: np.ndarray


@dataclass
class Cohort:
    people: pd.DataFrame
    inp: EngineInput
    scheduled: np.ndarray  # (U, T) bool
    completed: np.ndarray  # (U, T) bool
    true_change: np.ndarray  # (U, T) mean true change across families, SD units
    onset_day: np.ndarray  # (U,) NaN when no change onset
    is_decliner: np.ndarray  # (U,) bool
    end_day: float
    baseline_end_day: float
    items: ItemData
    params: dict[str, Any]
    arm: str
    seed: int
    meta: dict[str, Any] = field(default_factory=dict)


def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-x))


def _choice(rng: np.random.Generator, options: list[str], probs: list[float], n: int) -> np.ndarray:
    p = np.asarray(probs, float)
    return rng.choice(np.array(options), size=n, p=p / p.sum())


def schedule(params: dict[str, Any], arm: str) -> np.ndarray:
    nb = params["baseline_sessions"]
    burst = np.repeat(np.arange(nb // 2, dtype=float), 2) + np.tile([0.0, 0.4], nb // 2)
    start = float(nb // 2)
    fu = params["follow_up_days"]
    if arm == "daily":
        rest = start + np.arange(fu, dtype=float)
    elif arm == "burst":
        b = params["burst_arm"]
        days = []
        for first in np.arange(b["every_days"], fu, b["every_days"]):
            for d in range(b["days"]):
                for s in range(b["per_day"]):
                    days.append(start + first + d + 0.4 * s)
        rest = np.array(days)
    else:
        raise ValueError(arm)
    return np.concatenate([burst, rest])


CHUNK_USERS = 2500


def generate(
    n_users: int = 10_000,
    seed: int = 20261120,
    arm: str = "daily",
    params: dict[str, Any] | None = None,
    overrides: dict[str, float] | None = None,
) -> Cohort:
    """``overrides`` drives the sensitivity analysis: noise, prevalence, practice, missingness, context, informant.

    Users are generated in chunks (memory); item parameters are shared, and each chunk has a seed derived
    from ``seed``, so the cohort is reproducible from the seed alone.
    """
    p = params or load_params()
    ov = {"noise": 1.0, "prevalence": 1.0, "practice": 1.0, "missingness": 1.0, "context": 1.0, "informant": 1.0}
    ov.update(overrides or {})
    shared_rng = np.random.default_rng([seed, 0])
    it = p["items"]
    shared = {
        "b_shop": shared_rng.normal(0, it["item_difficulty_sd"], it["shopping_pool"]),
        "b_med": shared_rng.normal(0, it["item_difficulty_sd"], it["instruction_pool"]),
        "dif_shop": np.sort(shared_rng.choice(it["shopping_pool"], it["dif_items_per_family"], replace=False)),
        "dif_med": np.sort(shared_rng.choice(it["instruction_pool"], it["dif_items_per_family"], replace=False)),
    }
    parts = []
    for i, start in enumerate(range(0, n_users, CHUNK_USERS)):
        n = min(CHUNK_USERS, n_users - start)
        parts.append(_generate_chunk(np.random.default_rng([seed, i + 1]), n, p, ov, arm, shared))
    first = parts[0]
    inp = EngineInput.empty(n_users, first.inp.day.shape[1])
    for name in ("day", "scores", "context", "covariates", "informant_concern", "red_flag"):
        setattr(inp, name, np.concatenate([getattr(x.inp, name) for x in parts]))
    cat = lambda name: np.concatenate([getattr(x, name) for x in parts])  # noqa: E731
    icat = lambda name: np.concatenate([getattr(x.items, name) for x in parts])  # noqa: E731
    return Cohort(
        people=pd.concat([x.people for x in parts], ignore_index=True),
        inp=inp,
        scheduled=cat("scheduled"),
        completed=cat("completed"),
        true_change=cat("true_change"),
        onset_day=cat("onset_day"),
        is_decliner=cat("is_decliner"),
        end_day=first.end_day,
        baseline_end_day=first.baseline_end_day,
        items=ItemData(
            icat("shopping_items"), icat("shopping_hits"), icat("med_items"), icat("med_correct"), shared["dif_shop"], shared["dif_med"]
        ),
        params=p,
        arm=arm,
        seed=seed,
        meta={"overrides": ov},
    )


def _generate_chunk(
    rng: np.random.Generator, u: int, p: dict[str, Any], ov: dict[str, float], arm: str, shared: dict[str, np.ndarray]
) -> Cohort:
    pop = p["population"]

    # ---- people ----
    language = _choice(rng, list(pop["language"]), list(pop["language"].values()), u)
    age = _choice(rng, list(pop["age_band"]), list(pop["age_band"].values()), u)
    age_i = np.array([AGE_BANDS.index(a) for a in age])
    education = np.empty(u, dtype=object)
    for a in AGE_BANDS:
        m = age == a
        dist = pop["education_by_age"][a]
        education[m] = _choice(rng, list(dist), list(dist.values()), int(m.sum()))
    fl = pop["familiarity_logit"]
    lat = (
        fl["intercept"]
        + fl["per_age_band"] * age_i
        + np.where(education == "tertiary", fl["tertiary"], 0.0)
        + np.where(education == "none_primary", fl["none_primary"], 0.0)
        + rng.logistic(size=u)
    )
    familiarity = np.where(lat < -0.5, "low", np.where(lat < 1.5, "medium", "high"))
    female = rng.random(u) < pop["female"]
    device = _choice(rng, list(pop["device"]), list(pop["device"].values()), u)
    has_informant = rng.random(u) < pop["informant_share"]

    risk = p["risk"]
    age_mult = np.array([risk["age_multiplier"][a] for a in age])
    risk_n = sum((rng.random(u) < np.clip(risk[f] * age_mult, 0, 0.95)).astype(int) for f in ("obesity", "diabetes", "hypertension"))

    # ---- trajectory class ----
    cl = p["classes"]
    base = np.array([cl[c] for c in CLASSES], float)
    dmult = np.array([cl["decline_age_multiplier"][a] for a in age]) * risk["per_factor_decline_multiplier"] ** risk_n
    dmult = dmult * ov["prevalence"]
    probs = np.tile(base, (u, 1))
    is_d = np.array([c in DECLINE_CLASSES for c in CLASSES])
    probs[:, is_d] *= dmult[:, None]
    probs[:, 0] = np.clip(1.0 - probs[:, 1:].sum(1), 0.05, None)
    probs /= probs.sum(1, keepdims=True)
    cls_i = (probs.cumsum(1) > rng.random(u)[:, None]).argmax(1)
    cls = np.array(CLASSES)[cls_i]
    is_decliner = np.isin(cls, list(DECLINE_CLASSES))

    tr = p["trajectory"]
    nb = p["baseline_sessions"]
    baseline_end_day = float(nb // 2)
    has_onset = is_decliner | (cls == "transient")
    onset = np.where(has_onset, baseline_end_day + rng.uniform(*tr["onset_day"], u), np.nan)
    amnestic = rng.random(u) < tr["amnestic_share"]
    prof = np.where(
        amnestic[:, None],
        np.array([tr["family_profile_amnestic"][f] for f in FAMILIES]),
        np.array([tr["family_profile_other"][f] for f in FAMILIES]),
    )

    # ---- schedule ----
    day = schedule(p, arm)
    t = len(day)
    end_day = float(day[-1])

    since = np.clip(day[None, :] - np.nan_to_num(onset, nan=np.inf)[:, None], 0, None)  # (U, T) days since onset
    yrs = since / 365.0
    change = np.zeros((u, t))
    drift = rng.uniform(*tr["ageing_drift_sd_per_year"], u)
    change -= np.where(cls == "ageing_drift", drift, 0.0)[:, None] * ((day - baseline_end_day).clip(0) / 365.0)[None]
    slope = rng.uniform(*tr["slow_sd_per_year"], u)
    change -= np.where(cls == "slow", slope, 0.0)[:, None] * yrs
    acc = rng.uniform(*tr["accelerating_sd_at_one_year"], u)
    change -= np.where(cls == "accelerating", acc, 0.0)[:, None] * yrs**2
    step = rng.uniform(*tr["step_drop_sd"], u)
    started = day[None, :] >= np.nan_to_num(onset, nan=np.inf)[:, None]
    change -= np.where(cls == "step", step, 0.0)[:, None] * started
    tdrop = rng.uniform(*tr["transient_drop_sd"], u)
    tdur = rng.uniform(*tr["transient_days"], u)
    in_dip = started & (since < tdur[:, None]) & (cls == "transient")[:, None]
    change -= np.where(in_dip, tdrop[:, None], 0.0)
    fam_change = change[:, :, None] * np.where((cls == "transient")[:, None], 1.0, prof)[:, None, :]  # (U, T, F)
    true_change = fam_change.mean(2)

    # ---- adherence ----
    ad = p["adherence"]
    pc = np.array([ad["daily_completion"][f] for f in familiarity])
    if arm == "burst":
        pc = np.full(u, ad["baseline_completion"])
    p_done = pc[:, None] - ad["decline_completion_drop_per_sd"] * ov["missingness"] * np.abs(true_change)
    p_done = np.where(np.arange(t)[None, :] < nb, ad["baseline_completion"], p_done)
    if ov["missingness"] == 0:
        p_done = np.ones_like(p_done)
    t1 = rng.exponential(1.0 / (ad["dropout_hazard_per_day"] * max(ov["missingness"], 1e-9)), u)
    od = np.nan_to_num(onset, nan=np.inf)
    with np.errstate(invalid="ignore"):
        dropout = np.where(is_decliner & (t1 > od), od + (t1 - od) / ad["dropout_decliner_multiplier"], t1)
    dropout = np.where(ov["missingness"] == 0, np.inf, dropout + baseline_end_day)
    completed = (rng.random((u, t)) < np.clip(p_done, 0.02, 1.0)) & (day[None, :] < dropout[:, None])
    scheduled = np.ones((u, t), bool)  # every slot in follow-up is scheduled; drop-out counts as missed

    # ---- practice ----
    pr = p["practice"]
    shape = _choice(rng, list(pr["shares"]), list(pr["shares"].values()), u)
    gain = rng.uniform(*pr["gain_sd"], u) * ov["practice"]
    tau = rng.uniform(*pr["tau_sessions"], u)
    k = np.cumsum(completed, axis=1) - 1.0
    k = np.clip(k, 0, None)
    prac = np.where(
        (shape == "exponential")[:, None],
        1 - np.exp(-k / tau[:, None]),
        np.where((shape == "power")[:, None], 1 - 1 / (1 + k / tau[:, None]), 0.0),
    ) * gain[:, None]
    fam_prac = prac[:, :, None] * rng.uniform(0.7, 1.3, (u, 1, len(FAMILIES)))

    # ---- context ----
    cx = p["context"]
    ctx_true = np.zeros((u, t, len(CONTEXT_FACTORS)), bool)
    for name, prob in cx["daily_prob"].items():
        ctx_true[:, :, CONTEXT_FACTORS.index(name)] = rng.random((u, t)) < prob
    fasting_person = rng.random(u) < np.array([cx["fasting_share"][lang] for lang in language])
    ram = np.zeros(t, bool)
    for s in cx["ramadan_start_days"]:
        ram |= (day >= baseline_end_day + s) & (day < baseline_end_day + s + cx["ramadan_length"])
    ctx_true[:, :, CONTEXT_FACTORS.index("fasting")] = fasting_person[:, None] & ram[None, :]
    ill_i = CONTEXT_FACTORS.index("ill")
    reports_dip = rng.random(u) < tr["transient_reported_context"]
    ctx_true[:, :, ill_i] |= in_dip & reports_dip[:, None]
    eff = np.array([cx["true_effect_sd"][c] for c in CONTEXT_FACTORS]) * ov["context"]
    ctx_effect = ctx_true.astype(float) @ eff
    reported = ctx_true.copy()
    for j in range(len(CONTEXT_FACTORS)):
        reported[:, :, j] &= rng.random((u, t)) < cx["report_prob"]
    reported[:, :, ill_i] |= in_dip & reports_dip[:, None]

    # ---- covariates ----
    cv = p["covariates"]
    p_assist = np.array([cv["assisted_session_prob"][f] for f in familiarity])
    assisted = rng.random((u, t)) < p_assist[:, None]
    phone = np.repeat((device == "phone")[:, None], t, axis=1)

    # ---- ability and noise ----
    ab = p["ability"]
    rho = ab["family_correlation"]
    common = rng.standard_normal(u)
    theta = (
        np.sqrt(rho) * common[:, None]
        + np.sqrt(1 - rho) * rng.standard_normal((u, len(FAMILIES)))
        + np.array([ab["education_shift"][e] for e in education])[:, None]
        + np.array([ab["age_shift"][a] for a in age])[:, None]
    )
    nz = p["noise"]
    nmult = (
        nz["scale"]
        * ov["noise"]
        * np.where(familiarity == "low", nz["low_familiarity_multiplier"], 1.0)
        * np.where(age == "75+", nz["age75_multiplier"], 1.0)
        * np.where(education == "none_primary", nz["none_primary_multiplier"], 1.0)
    )
    df = nz["student_t_df"]
    noise = rng.standard_t(df, (u, t, len(FAMILIES))) * np.sqrt((df - 2) / df) * nmult[:, None, None]

    a = theta[:, None, :] + fam_prac + fam_change + ctx_effect[:, :, None] + noise
    a += assisted[:, :, None] * cv["true_assisted_effect_sd"]
    a[:, :, FAMILIES.index("speed")] += phone * cv["true_phone_speed_effect_sd"]

    # ---- observed scores through item-level links ----
    it = p["items"]
    is_focal_lang = language == it["dif_group"]["shopping"]["language"]
    is_focal_edu = education == it["dif_group"]["medication"]["education"]
    b_shop, b_med = shared["b_shop"], shared["b_med"]
    dif_shop, dif_med = shared["dif_shop"], shared["dif_med"]
    dshop = np.zeros(it["shopping_pool"])
    dshop[dif_shop] = it["dif_logit"]
    dmed = np.zeros(it["instruction_pool"])
    dmed[dif_med] = it["dif_logit"]

    nt, rows = it["shopping_targets"], it["medication_rows"]
    scores = np.full((u, t, len(FAMILIES)), np.nan)
    keep_shop_items = np.zeros((u, nb, nt), int)
    keep_shop_hits = np.zeros((u, nb, nt), bool)
    keep_med_items = np.zeros((u, nb, rows), int)
    keep_med_ok = np.zeros((u, nb, rows), bool)
    chunk = 128
    for c0 in range(0, t, chunk):
        c1 = min(t, c0 + chunk)
        n = c1 - c0
        am = a[:, c0:c1, 0]
        mem = np.zeros((u, n))
        for phase, intercept in (("immediate", 1.0), ("delayed", 0.6)):
            start = rng.integers(0, it["shopping_pool"], (u, n, 1))
            stride = rng.choice(COPRIME_30, (u, n, 1))
            ids = (start + stride * np.arange(nt)) % it["shopping_pool"]
            logit = intercept + 1.2 * am[:, :, None] - b_shop[ids] - dshop[ids] * is_focal_lang[:, None, None]
            hits = rng.random(ids.shape) < _sigmoid(logit)
            fa = rng.binomial(it["shopping_foils"], _sigmoid(-2.2 - 0.5 * am))
            mem += hits.mean(2) - fa / it["shopping_foils"]
            if phase == "immediate" and c0 < nb:
                m = min(nb, c1) - c0
                keep_shop_items[:, c0 : c0 + m] = ids[:, :m]
                keep_shop_hits[:, c0 : c0 + m] = hits[:, :m]
        scores[:, c0:c1, 0] = mem / 2

        asp = a[:, c0:c1, 1]
        rt_simple = np.clip(0.45 * np.exp(-0.12 * asp), 0.2, 2.4)  # app lapse cutoff is 3 s
        scores[:, c0:c1, 1] = -0.5 * (np.log(rt_simple) + np.log(rt_simple * 1.25))

        ae = a[:, c0:c1, 2]
        start = rng.integers(0, it["instruction_pool"], (u, n, 1))
        stride = rng.choice(COPRIME_15, (u, n, 1))
        ids = (start + stride * np.arange(rows)) % it["instruction_pool"]
        ok = rng.random(ids.shape) < _sigmoid(1.6 + 1.3 * ae[:, :, None] - b_med[ids] - dmed[ids] * is_focal_edu[:, None, None])
        cell_err = np.where(ok, 0, np.where(rng.random(ids.shape) < 0.7, 1, 2)).sum(2)
        acc_cells = 1 - cell_err / (rows * 3)
        time_s = 30 * np.exp(-0.15 * ae + 0.1 * rng.standard_normal((u, n)))
        scores[:, c0:c1, 2] = acc_cells - 0.1 * np.log(time_s / 30)
        if c0 < nb:
            m = min(nb, c1) - c0
            keep_med_items[:, c0 : c0 + m] = ids[:, :m]
            keep_med_ok[:, c0 : c0 + m] = ok[:, :m]

    scores[~completed] = np.nan

    # ---- informant ----
    inf = p["informant"]
    concern = np.zeros((u, t), bool)
    month_slots = [int(np.argmin(np.abs(day - d))) for d in np.arange(baseline_end_day + 30, end_day, 30)]
    for s in month_slots:
        lg = inf["logit_intercept"] + inf["logit_per_sd_change"] * ov["informant"] * np.clip(-true_change[:, s], 0, None)
        concern[:, s] = has_informant & (rng.random(u) < _sigmoid(lg))

    inp = EngineInput.empty(u, t)
    inp.day[:] = day
    inp.scores[:] = scores
    inp.context[:] = reported & completed[:, :, None]
    inp.covariates[:, :, COVARIATES.index("assisted")] = assisted & completed
    inp.covariates[:, :, COVARIATES.index("phone")] = phone & completed
    inp.informant_concern[:] = concern

    people = pd.DataFrame(
        {
            "language": language,
            "age_band": age,
            "education": education.astype(str),
            "familiarity": familiarity,
            "sex": np.where(female, "female", "male"),
            "device": device,
            "has_informant": has_informant,
            "risk_factors": risk_n,
            "trajectory": cls,
            "amnestic": amnestic,
            "onset_day": onset,
            "dropout_day": np.where(np.isfinite(dropout), dropout, np.nan),
            "fasting": fasting_person,
            "practice_shape": shape,
        }
    )
    return Cohort(
        people=people,
        inp=inp,
        scheduled=scheduled,
        completed=completed,
        true_change=true_change,
        onset_day=onset,
        is_decliner=is_decliner,
        end_day=end_day,
        baseline_end_day=baseline_end_day,
        items=ItemData(keep_shop_items, keep_shop_hits, keep_med_items, keep_med_ok, dif_shop, dif_med),
        params=p,
        arm=arm,
        seed=-1,
    )
