"""One command: generate the cohort, sweep thresholds, choose v1 by the pre-registered rule, report.

    python -m baseline_lab.run            # full protocol run (about 30 minutes on 4 cores)
    python -m baseline_lab.run --fast     # small smoke run for development (not reportable)
"""

from __future__ import annotations

import argparse
import json
import math
import time
import warnings
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd

from baseline_engine import __version__ as ENGINE_VERSION
from baseline_engine.config import DEFAULT_CONFIG, EngineConfig
from baseline_engine.core import STATE_NAMES, EngineInput, State, run

from . import PROTOCOL_VERSION
from .dif import run_dif
from .generator import Cohort, generate
from .metrics import Bootstrap, fairness, reliability, segments, summary, user_outcomes
from .pathway import pathway
from .report import write_report

ROOT = Path(__file__).resolve().parents[3]
FALSE_LIMIT = 30.0
GAP_LIMIT = 0.10
RATIO_LIMIT = 1.5
CHUNK = 2500


@dataclass
class Flags:
    first_review_day: np.ndarray
    first_watch_day: np.ndarray


def subset(inp: EngineInput, idx: np.ndarray | slice) -> EngineInput:
    return EngineInput(
        day=inp.day[idx],
        scores=inp.scores[idx],
        context=inp.context[idx],
        covariates=inp.covariates[idx],
        informant_concern=inp.informant_concern[idx],
        red_flag=inp.red_flag[idx],
    )


def run_engine(c: Cohort, cfg: EngineConfig) -> Flags:
    u = c.inp.day.shape[0]
    rev, wat = np.full(u, np.nan), np.full(u, np.nan)
    for s in range(0, u, CHUNK):
        sl = slice(s, min(u, s + CHUNK))
        out = run(subset(c.inp, sl), cfg, detail=False)
        rev[sl], wat[sl] = out.first_review_day, out.first_watch_day
    return Flags(rev, wat)


def config_for(z: float, gate: str, version: str = "sweep") -> EngineConfig:
    return DEFAULT_CONFIG.with_(
        watch_z=round(z, 2), rapid_z=round(min(-2.33, z - 0.7), 2), two_stage=gate == "two_stage", threshold_version=version
    )


def sweep_row(df: pd.DataFrame, z: float, gate: str) -> dict:
    s = summary(df)
    fair = fairness(df)
    worst_gap = max(v["sensitivity_gap"] for v in fair.values())
    worst_ratio = max(v["false_ratio"] for v in fair.values())
    fails = []
    if s["false_reviews_per_1000_py"]["est"] > FALSE_LIMIT:
        fails.append("false_referrals")
    for var, v in fair.items():
        if v["sensitivity_gap"] > GAP_LIMIT:
            fails.append(f"sensitivity_gap:{var}")
        if v["false_ratio"] > RATIO_LIMIT:
            fails.append(f"false_ratio:{var}")
    return {
        "watch_z": z,
        "rapid_z": round(min(-2.33, z - 0.7), 2),
        "gate": gate,
        "sensitivity_12m": s["sensitivity_12m"]["est"],
        "specificity_12m": s["specificity_12m"]["est"],
        "false_reviews_per_1000_py": s["false_reviews_per_1000_py"]["est"],
        "ppv": s["ppv"]["est"],
        "lead_days_median": s["lead_days_median"]["est"],
        "worst_sensitivity_gap": worst_gap,
        "worst_false_ratio": worst_ratio,
        "fairness": {k: {"sensitivity_gap": v["sensitivity_gap"], "false_ratio": v["false_ratio"]} for k, v in fair.items()},
        "fails": fails,
        "feasible": not fails,
    }


def choose_v1(rows: list[dict]) -> dict:
    """Protocol 5.2 with A3 item 2 fallback."""
    feasible = [r for r in rows if r["feasible"]]
    if feasible:
        best = max(feasible, key=lambda r: (r["sensitivity_12m"], -nan0(r["lead_days_median"])))
        return {**best, "rule": "all constraints met; highest 12-month sensitivity (ties: shorter lead time)"}
    meets_false = [r for r in rows if r["false_reviews_per_1000_py"] <= FALSE_LIMIT]
    if meets_false:
        def violation(r: dict) -> float:
            return max(r["worst_sensitivity_gap"] / GAP_LIMIT, r["worst_false_ratio"] / RATIO_LIMIT)

        best = min(meets_false, key=lambda r: (violation(r), -r["sensitivity_12m"]))
        return {**best, "rule": "fallback (A3.2): no setting met all constraints; smallest worst fairness violation among settings within the false-referral limit"}
    best = min(rows, key=lambda r: r["false_reviews_per_1000_py"])
    return {**best, "rule": "fallback (A3.2): no setting met the false-referral limit; lowest false-referral rate"}


def nan0(x: float) -> float:
    return 0.0 if x is None or (isinstance(x, float) and math.isnan(x)) else x


def failure_report(df: pd.DataFrame) -> dict:
    missed = df[(df["eligible_sens"] > 0) & (df["detected"] == 0)]
    hit = df[df["detected"] > 0]
    false = df[df["false_review"] > 0]

    def profile(g: pd.DataFrame) -> dict:
        if not len(g):
            return {"n": 0}
        return {
            "n": int(len(g)),
            "trajectory": g["trajectory"].value_counts(normalize=True).round(3).to_dict(),
            "age_band": g["age_band"].value_counts(normalize=True).round(3).to_dict(),
            "familiarity": g["familiarity"].value_counts(normalize=True).round(3).to_dict(),
            "amnestic_share": float(g["amnestic"].mean()),
            "completion_mean": float((g["sessions_done"] / g["sessions_scheduled"]).mean()),
            "dropped_out_share": float(g["dropped_out"].mean()),
        }

    return {"missed_decliners": profile(missed), "detected_decliners": profile(hit), "false_reviews": profile(false)}


def timelapse(c: Cohort, df: pd.DataFrame, cfg: EngineConfig) -> list[dict]:
    rng = np.random.default_rng(3)

    def pick(mask: pd.Series) -> int | None:
        idx = np.flatnonzero(mask.to_numpy())
        return int(rng.choice(idx)) if len(idx) else None

    choices = [
        ("khalid", "Slow change, picked up early", pick((df.trajectory == "slow") & (df.detected > 0) & (df.sex == "male") & (df.age_band == "65-74") & (df.language == "ar"))),
        ("stable", "Stable over two years", pick((df.trajectory == "stable") & (df.any_review == 0) & (df.familiarity != "low"))),
        ("context_dip", "Short dip while unwell, no referral", pick((df.trajectory == "transient") & (df.any_review == 0) & np.isfinite(df.watch_day))),
    ]
    choices = [(k, label, i) for k, label, i in choices if i is not None]
    idx = np.array([i for _, _, i in choices])
    out = run(subset(c.inp, idx), cfg)
    day = c.inp.day[0]
    keep = np.flatnonzero((np.arange(len(day)) < 14) | ((np.floor(day) % 7) == 0))
    users = []
    for j, (key, label, i) in enumerate(choices):
        row = df.iloc[i]
        users.append(
            {
                "key": key,
                "label": label,
                "profile": {k: (row[k].item() if hasattr(row[k], "item") else row[k]) for k in ("language", "age_band", "education", "familiarity", "sex", "trajectory")},
                "onset_day": None if not np.isfinite(row["onset_day"]) else float(row["onset_day"]),
                "review_day": None if not np.isfinite(row["review_day"]) else float(row["review_day"]),
                "points": [
                    {
                        "day": float(day[t]),
                        "z": None if not np.isfinite(out.comp_z[j, t]) else round(float(out.comp_z[j, t]), 3),
                        "state": STATE_NAMES[State(out.state[j, t])],
                        "true_change": round(float(c.true_change[i, t]), 3),
                        "done": bool(c.completed[i, t]),
                    }
                    for t in keep
                ],
            }
        )
    return users


def jsonable(x):
    if isinstance(x, dict):
        return {str(k): jsonable(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [jsonable(v) for v in x]
    if isinstance(x, (np.floating, float)):
        return None if not math.isfinite(float(x)) else round(float(x), 5)
    if isinstance(x, (np.integer,)):
        return int(x)
    if isinstance(x, np.bool_):
        return bool(x)
    return x


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--users", type=int, default=10_000)
    ap.add_argument("--seed", type=int, default=20261120)
    ap.add_argument("--fast", action="store_true", help="small development run; results are not reportable")
    ap.add_argument("--out", type=Path, default=ROOT / "lab" / "outputs")
    a = ap.parse_args()
    warnings.filterwarnings("ignore", message="Mean of empty slice", category=RuntimeWarning)

    fast = a.fast
    n_users = 2000 if fast else a.users
    n_sens = 1000 if fast else 5000
    n_boot = 200 if fast else 1000
    zs = [round(z, 1) for z in np.arange(-1.0, -2.51, -0.3 if fast else -0.1)]
    t0 = time.time()
    log = lambda m: print(f"[{time.time() - t0:7.1f}s] {m}", flush=True)  # noqa: E731

    log(f"generating main cohort: {n_users} users, daily arm, seed {a.seed}")
    c = generate(n_users, a.seed, "daily")

    rows = []
    for gate in ("two_stage", "one_stage"):
        for z in zs:
            flags = run_engine(c, config_for(z, gate))
            rows.append(sweep_row(user_outcomes(c, flags), z, gate))
            r = rows[-1]
            log(f"sweep {gate:9} z {z:5.1f}: sens {r['sensitivity_12m']:.3f} spec {r['specificity_12m']:.3f} false/1000py {r['false_reviews_per_1000_py']:6.1f} {'OK' if r['feasible'] else ','.join(r['fails'])}")

    v1 = choose_v1(rows)
    log(f"v1: z {v1['watch_z']} gate {v1['gate']} ({v1['rule']})")
    cfg = config_for(v1["watch_z"], v1["gate"], version="v1")
    other_gate = "one_stage" if v1["gate"] == "two_stage" else "two_stage"

    flags = run_engine(c, cfg)
    df = user_outcomes(c, flags)
    boot = Bootstrap(len(df), n_boot)
    log("main metrics with bootstrap intervals")
    main_res = summary(df, boot)
    seg = segments(df, boot)
    fair = fairness(df)

    log("gate comparison")
    df_other = user_outcomes(c, run_engine(c, config_for(v1["watch_z"], other_gate)))
    two = df if v1["gate"] == "two_stage" else df_other
    one = df_other if v1["gate"] == "two_stage" else df
    both = (two["detected"] > 0) & (one["detected"] > 0)
    extra_delay = float(np.median(two.loc[both, "review_day"] - one.loc[both, "review_day"])) if both.any() else float("nan")
    gate_cmp = {
        "two_stage": summary(two, boot),
        "one_stage": summary(one, boot),
        "extra_delay_days_median": extra_delay,
        "n_detected_by_both": int(both.sum()),
    }

    log("reliability")
    rel = reliability(c, boot, n_boot=n_boot)
    log("DIF")
    dif = run_dif(c)
    log("pathway model")
    path = pathway(df, c.params)
    fails = failure_report(df)

    log("ablations")
    ablations = []
    for name, change in (
        ("full model", {}),
        ("no context adjustment", {"use_context": False}),
        ("no practice modelling", {"use_practice": False}),
        ("no informant", {"use_informant": False}),
        ("no Fair-layer covariates", {"use_covariates": False}),
    ):
        d = df if not change else user_outcomes(c, run_engine(c, cfg.with_(**change)))
        s = summary(d)
        ablations.append({"name": name, **{k: s[k]["est"] for k in ("sensitivity_12m", "specificity_12m", "false_reviews_per_1000_py", "ppv", "lead_days_median")}})

    log("time-lapse users")
    tl = timelapse(c, df, cfg)
    del c

    log("sensitivity analysis cohorts")
    sens = []
    for label, ov in (
        ("baseline assumptions", {}),
        ("noise x0.5", {"noise": 0.5}),
        ("noise x2", {"noise": 2.0}),
        ("decline prevalence halved", {"prevalence": 0.5}),
        ("decline prevalence doubled", {"prevalence": 2.0}),
        ("practice effect x0.5", {"practice": 0.5}),
        ("practice effect x2", {"practice": 2.0}),
        ("missingness off", {"missingness": 0.0}),
        ("missingness doubled", {"missingness": 2.0}),
        ("context effects -50%", {"context": 0.5}),
        ("context effects +50%", {"context": 1.5}),
        ("informant accuracy halved", {"informant": 0.5}),
        ("informant accuracy doubled", {"informant": 2.0}),
    ):
        cs = generate(n_sens, a.seed, "daily", overrides=ov)
        d = user_outcomes(cs, run_engine(cs, cfg))
        s = summary(d)
        sens.append({"name": label, **{k: s[k]["est"] for k in ("sensitivity_12m", "specificity_12m", "false_reviews_per_1000_py", "ppv", "lead_days_median", "completion")}})
        log(f"  {label}: sens {sens[-1]['sensitivity_12m']:.3f} false/1000py {sens[-1]['false_reviews_per_1000_py']:.1f}")
        del cs

    log("burst arm")
    cb = generate(n_users, a.seed, "burst")
    db = user_outcomes(cb, run_engine(cb, cfg))
    burst = {"summary": summary(db, Bootstrap(len(db), n_boot)), "reliability": reliability(cb, boot, n_boot=min(n_boot, 300))}
    del cb

    icc_halves = rel["baseline_halves"]["composite"]["icc"]
    icc_blocks = rel["consecutive_blocks"]["composite"]["icc"]
    worst_gap = max(v["sensitivity_gap"] for v in fair.values())
    worst_ratio = max(v["false_ratio"] for v in fair.values())
    criteria = [
        {"name": "Composite test-retest ICC in Stable users", "target": ">= 0.75 (baseline halves and consecutive blocks)", "value": f"{icc_halves:.2f} / {icc_blocks:.2f}", "pass": icc_halves >= 0.75 and icc_blocks >= 0.75},
        {"name": "12-month specificity", "target": ">= 0.95", "value": f"{main_res['specificity_12m']['est']:.3f}", "pass": main_res["specificity_12m"]["est"] >= 0.95},
        {"name": "False referrals per 1,000 person-years", "target": "<= 30", "value": f"{main_res['false_reviews_per_1000_py']['est']:.1f}", "pass": main_res["false_reviews_per_1000_py"]["est"] <= FALSE_LIMIT},
        {
            "name": "Two-stage vs one-stage gate",
            "target": "fewer false referrals; median extra delay <= 30 days",
            "value": f"{gate_cmp['two_stage']['false_reviews_per_1000_py']['est']:.1f} vs {gate_cmp['one_stage']['false_reviews_per_1000_py']['est']:.1f}; +{extra_delay:.0f} days",
            "pass": gate_cmp["two_stage"]["false_reviews_per_1000_py"]["est"] < gate_cmp["one_stage"]["false_reviews_per_1000_py"]["est"] and extra_delay <= 30,
        },
        {"name": "Fairness", "target": "sensitivity gap <= 0.10; false-referral ratio <= 1.5", "value": f"gap {worst_gap:.2f}; ratio {worst_ratio:.2f}", "pass": worst_gap <= GAP_LIMIT and worst_ratio <= RATIO_LIMIT},
        {"name": "DIF", "target": ">= 2 of 3 planted items found per family; <= 5% false flags", "value": f"shopping {dif['shopping']['found']}/3, {dif['shopping']['false_flags']} false; medication {dif['medication']['found']}/3, {dif['medication']['false_flags']} false", "pass": dif["shopping"]["pass"] and dif["medication"]["pass"]},
    ]

    results = {
        "meta": {
            "label": "Simulated: operating characteristics under stated assumptions. Not clinical accuracy.",
            "protocol_version": PROTOCOL_VERSION,
            "amendments": ["A1", "A2", "A3"],
            "generator_version": df.attrs.get("generator_version", "gen-1.0"),
            "engine_version": ENGINE_VERSION,
            "seed": a.seed,
            "n_users": n_users,
            "n_sensitivity_cohort": n_sens,
            "n_bootstrap": n_boot,
            "arm": "daily",
            "fast_mode": fast,
            "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "runtime_seconds": round(time.time() - t0),
        },
        "cohort": {
            "trajectory": df["trajectory"].value_counts().to_dict(),
            "segments": {v: df[v].value_counts().to_dict() for v in ("language", "age_band", "education", "familiarity", "sex")},
        },
        "sweep": rows,
        "v1": {"watch_z": v1["watch_z"], "rapid_z": v1["rapid_z"], "gate": v1["gate"], "rule": v1["rule"], "fails": v1["fails"]},
        "main": main_res,
        "segments": seg,
        "fairness": fair,
        "gate_comparison": gate_cmp,
        "reliability": rel,
        "dif": {k: ({kk: vv for kk, vv in v.items() if kk != "items"} if isinstance(v, dict) and k != "exploratory_purified" else v) for k, v in dif.items()},
        "dif_items": {k: dif[k]["items"] for k in ("shopping", "medication")},
        "pathway": path,
        "ablations": ablations,
        "sensitivity_analysis": sens,
        "burst_arm": burst,
        "failures": fails,
        "criteria": criteria,
        "timelapse": tl,
    }
    results = jsonable(results)

    a.out.mkdir(parents=True, exist_ok=True)
    (a.out / "results.json").write_text(json.dumps(results, indent=1), encoding="utf-8")
    report = write_report(results)
    (a.out / "validation-report.md").write_text(report, encoding="utf-8")
    if not fast:
        web = ROOT / "web" / "public" / "lab"
        web.mkdir(parents=True, exist_ok=True)
        (web / "results.json").write_text(json.dumps(results), encoding="utf-8")
        (ROOT / "docs" / "validation-report.md").write_text(report, encoding="utf-8")
    log(f"done -> {a.out}")


if __name__ == "__main__":
    main()
