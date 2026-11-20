"""Pilot week: turn anonymised app exports into the numbers the Lab currently assumes.

    python -m baseline_lab.pilot path/to/exports/   # one baseline-pilot-*.json per participant

Each file comes from the app's "Pilot week" export (Privacy page, research-use consent on). It holds
age/education/familiarity bands and sessions with raw events removed and dates shifted; no names,
birth year or profile id. Output: lab/outputs/pilot-report.md and pilot-results.json.

What a one-week pilot can and cannot settle:
- completion over one week, within-person noise per family, practice gain, within-week agreement
  (odd vs even sessions), session length, by language / education / familiarity where n allows;
- not long-run adherence, not six-month retest, not sensitivity or specificity.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import numpy as np

from baseline_engine.config import DEFAULT_CONFIG, FAMILIES
from baseline_engine.schemas import Session
from baseline_engine.scoring import family_scores

from .metrics import icc_2_1

ROOT = Path(__file__).resolve().parents[3]
EXPORT_KIND = "baseline-pilot-export"
LAB_ASSUMED = {
    "completion": {"low": 0.62, "medium": 0.72, "high": 0.80},
    "lab_completion_overall": 0.54,
}


def load(folder: Path) -> list[dict]:
    out = []
    for f in sorted(folder.glob("*.json")):
        d = json.loads(f.read_text(encoding="utf-8"))
        if d.get("kind") == EXPORT_KIND:
            out.append(d)
    return out


def participant(d: dict) -> dict:
    sessions = [Session.model_validate(s) for s in d["sessions"]]
    done = [s for s in sessions if s.completed]
    days = int(d.get("windowDays") or 7)
    first = min((s.started_at for s in sessions), default=None)
    day_idx = {int((s.started_at - first).total_seconds() // 86400) for s in done} if first else set()
    fs = [family_scores(s) for s in done]
    scores = np.array([[np.nan if x[f] is None else x[f] for f in FAMILIES] for x in fs], float).reshape(-1, len(FAMILIES))
    minutes = [((s.ended_at or s.started_at) - s.started_at).total_seconds() / 60 for s in done if s.ended_at]
    resid_sd, gain = [], []
    for j in range(len(FAMILIES)):
        y = scores[:, j]
        ok = np.isfinite(y)
        if ok.sum() >= 4:
            k = np.arange(len(y))[ok]
            b = np.polyfit(k, y[ok], 1)
            resid_sd.append(float(np.std(y[ok] - np.polyval(b, k), ddof=2)))
            gain.append(float(b[0] * (k.max() - k.min())))
        else:
            resid_sd.append(float("nan"))
            gain.append(float("nan"))
    return {
        "code": d["participant"],
        **d.get("bands", {}),
        "days_with_session": len([i for i in day_idx if i < days]),
        "window_days": days,
        "sessions_done": len(done),
        "median_minutes": float(np.median(minutes)) if minutes else float("nan"),
        "scores": scores,
        "within_sd": resid_sd,
        "practice_gain": gain,
    }


def _nanmed(xs: list[float]) -> float:
    xs = [x for x in xs if isinstance(x, float) and math.isfinite(x)]
    return float(np.median(xs)) if xs else float("nan")


def summarize(people: list[dict]) -> dict:
    prior = DEFAULT_CONFIG.prior_sd
    completion = [p["days_with_session"] / p["window_days"] for p in people]
    res: dict = {
        "n": len(people),
        "completion_mean": float(np.mean(completion)) if people else float("nan"),
        "median_session_minutes": _nanmed([p["median_minutes"] for p in people]),
        "families": {},
        "by_group": {},
    }
    means = {}
    for j, f in enumerate(FAMILIES):
        odd = [np.nanmean(p["scores"][0::2, j]) if len(p["scores"]) >= 4 else np.nan for p in people]
        even = [np.nanmean(p["scores"][1::2, j]) if len(p["scores"]) >= 4 else np.nan for p in people]
        x = np.column_stack([odd, even]) if people else np.zeros((0, 2))
        means[f] = x
        sd = _nanmed([p["within_sd"][j] for p in people])
        res["families"][f] = {
            "within_person_sd": sd,
            "engine_prior_sd": prior[f],
            "ratio_to_prior": sd / prior[f] if math.isfinite(sd) else float("nan"),
            "practice_gain_median": _nanmed([p["practice_gain"][j] for p in people]),
            "odd_even_icc": icc_2_1(x) if len(x) else float("nan"),
        }
    if people:
        z = []
        for f in FAMILIES:
            x = means[f]
            between = np.nanstd(np.nanmean(x, axis=1))
            z.append((x - np.nanmean(x)) / between if between > 0 else np.full_like(x, np.nan))
        comp = np.nanmean(np.stack(z), axis=0)
        res["composite_odd_even_icc"] = icc_2_1(comp)
    for var in ("language", "education", "familiarity", "ageBand"):
        groups: dict[str, list[float]] = {}
        for p, c in zip(people, completion):
            groups.setdefault(str(p.get(var, "unknown")), []).append(c)
        res["by_group"][var] = {k: {"n": len(v), "completion": float(np.mean(v))} for k, v in sorted(groups.items())}
    return res


def report(s: dict) -> str:
    L = ["# Pilot week report", "", f"_Real participants, n = {s['n']}. A one-week pilot measures usability, completion over one week, noise and within-week agreement. It cannot measure long-run adherence, six-month retest, or accuracy._", ""]
    L += [f"- Days with a completed session: **{s['completion_mean']:.0%}** (Lab assumes {LAB_ASSUMED['lab_completion_overall']:.0%} over a year, with 62–80% by phone familiarity before fading and drop-out)."]
    L += [f"- Median session length: {s['median_session_minutes']:.1f} minutes."]
    if "composite_odd_even_icc" in s:
        L += [f"- Composite odd-vs-even agreement, ICC(2,1): {s['composite_odd_even_icc']:.2f} (Lab: 0.88–0.94; ARC research cohort: > 0.85 at 6 and 12 months [B13])."]
    L += ["", "| Family | Within-person SD | Engine prior SD | Ratio | Practice gain over the week | Odd-even ICC |", "|---|---|---|---|---|---|"]
    for f, x in s["families"].items():
        L += [f"| {f} | {x['within_person_sd']:.3f} | {x['engine_prior_sd']:.3f} | {x['ratio_to_prior']:.2f} | {x['practice_gain_median']:+.3f} | {x['odd_even_icc']:.2f} |"]
    L += ["", "A ratio far from 1 means the engine's noise prior should be updated before any threshold is trusted.", ""]
    for var, g in s["by_group"].items():
        L += [f"**{var}:** " + "; ".join(f"{k} {v['completion']:.0%} (n {v['n']})" for k, v in g.items())]
    L += ["", "Group splits are descriptive only at this sample size."]
    return "\n".join(L) + "\n"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("folder", type=Path)
    ap.add_argument("--out", type=Path, default=ROOT / "lab" / "outputs")
    a = ap.parse_args()
    people = [participant(d) for d in load(a.folder)]
    s = summarize(people)
    a.out.mkdir(parents=True, exist_ok=True)
    (a.out / "pilot-results.json").write_text(json.dumps(s, indent=1, default=float), encoding="utf-8")
    (a.out / "pilot-report.md").write_text(report(s), encoding="utf-8")
    print(report(s))


if __name__ == "__main__":
    main()
