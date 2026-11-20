"""Mantel-Haenszel DIF on baseline-burst item responses (protocol 4, A2 item 5)."""

from __future__ import annotations

import numpy as np
from scipy.stats import chi2

from .generator import Cohort

ALPHA = 0.01


def mantel_haenszel(correct: np.ndarray, focal: np.ndarray, stratum: np.ndarray) -> dict:
    """MH chi-square (continuity-corrected), common odds ratio and ETS delta for one item."""
    a_sum = e_sum = v_sum = num = den = 0.0
    for s in np.unique(stratum):
        m = stratum == s
        ref, foc = m & ~focal, m & focal
        a = float(correct[ref].sum())
        b = float(ref.sum() - a)
        c = float(correct[foc].sum())
        d = float(foc.sum() - c)
        n = a + b + c + d
        if n < 2 or (a + b) == 0 or (c + d) == 0:
            continue
        a_sum += a
        e_sum += (a + b) * (a + c) / n
        v_sum += (a + b) * (c + d) * (a + c) * (b + d) / (n * n * (n - 1))
        num += a * d / n
        den += b * c / n
    if v_sum <= 0 or den <= 0 or num <= 0:
        return {"chi2": 0.0, "p": 1.0, "odds_ratio": float("nan"), "ets_delta": float("nan")}
    stat = (abs(a_sum - e_sum) - 0.5) ** 2 / v_sum
    alpha_mh = num / den
    return {"chi2": stat, "p": float(chi2.sf(stat, 1)), "odds_ratio": alpha_mh, "ets_delta": -2.35 * float(np.log(alpha_mh))}


def _family(
    items: np.ndarray,
    correct: np.ndarray,
    done: np.ndarray,
    groups: dict[str, np.ndarray],
    pool: int,
    planted: np.ndarray,
    planted_group: str,
    exclude: dict[str, set[int]] | None = None,
) -> dict:
    """``exclude`` (exploratory purification) drops items from the matching score, per grouping."""
    u, s, k = items.shape
    sel = np.repeat(done[:, :, None], k, axis=2)
    user = np.broadcast_to(np.arange(u)[:, None, None], items.shape)[sel]
    it, y = items[sel], correct[sel]
    n_tests = pool
    rows = []
    for gname, focal_user in groups.items():
        drop = np.isin(items, list((exclude or {}).get(gname, set())))
        total = np.where(drop, False, correct).sum(2, keepdims=True)
        rest = (np.broadcast_to(total, correct.shape) - np.where(drop, False, correct))[sel]
        f = focal_user[user]
        for i in range(pool):
            m = it == i
            res = mantel_haenszel(y[m], f[m], rest[m])
            flagged = res["p"] < ALPHA / n_tests
            rows.append({"item": i, "grouping": gname, "planted": bool(i in planted and gname == planted_group), "flagged": bool(flagged), **res})
    planted_rows = [x for x in rows if x["planted"]]
    other = [x for x in rows if not x["planted"]]
    found = sum(x["flagged"] for x in planted_rows)
    false_flags = sum(x["flagged"] for x in other)
    return {
        "planted_items": [int(i) for i in planted],
        "planted_grouping": planted_group,
        "found": int(found),
        "planted": len(planted_rows),
        "false_flags": int(false_flags),
        "tests_unbiased": len(other),
        "false_flag_rate": false_flags / len(other) if other else 0.0,
        "pass": found >= 2 and (false_flags / len(other) if other else 0.0) <= 0.05,
        "items": rows,
    }


def run_dif(c: Cohort) -> dict:
    nb = c.params["baseline_sessions"]
    done = c.completed[:, :nb]
    groups = {
        "language": (c.people["language"] == "ar").to_numpy(),
        "education": (c.people["education"] == "none_primary").to_numpy(),
    }
    it = c.params["items"]
    fams = {
        "shopping": (c.items.shopping_items, c.items.shopping_hits, it["shopping_pool"], c.items.shopping_dif, "language"),
        "medication": (c.items.med_items, c.items.med_correct, it["instruction_pool"], c.items.med_dif, "education"),
    }
    primary = {name: _family(a, b, done, groups, pool, pl, pg) for name, (a, b, pool, pl, pg) in fams.items()}
    purified = {}
    for name, (a, b, pool, pl, pg) in fams.items():
        flagged = {g: {r["item"] for r in primary[name]["items"] if r["flagged"] and r["grouping"] == g} for g in groups}
        res = _family(a, b, done, groups, pool, pl, pg, exclude=flagged)
        purified[name] = {k: v for k, v in res.items() if k != "items"}
    return {
        **primary,
        "alpha": ALPHA,
        "correction": "Bonferroni within family",
        "exploratory_purified": {
            "label": "Exploratory, not pre-registered: two-step MH purification (items flagged in step 1 removed from the matching score).",
            **purified,
        },
    }
