"""Item bias (DIF) on baseline-burst item responses.

Primary method (amendment A4): logistic-regression DIF matched on each person's ability across the
whole baseline burst, with iterative purification, a 2-df likelihood-ratio test (uniform + non-uniform),
Benjamini-Hochberg false-discovery control, and an effect-size floor (ETS |delta| >= 1.0).

The pre-registered method (protocol 4, A2 item 5: Mantel-Haenszel on per-session rest scores) is still
run and reported. Its matching score comes from only 4-6 items in one session, so with a group that
truly differs in ability (education) it flags most fair items; A4 was adopted after seeing that result.
"""

from __future__ import annotations

import numpy as np
from scipy.stats import chi2

from .generator import Cohort

MH_ALPHA = 0.01
LR_Q = 0.01
"""Benjamini-Hochberg false-discovery rate across all items and groupings in one family."""
MIN_ETS_DELTA = 1.0
"""ETS effect-size floor: |delta| >= 1.0 is at least moderate ("B") DIF; smaller is negligible."""
MAX_PURIFY = 6


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


def _logit_fit(x: np.ndarray, y: np.ndarray, iters: int = 30) -> tuple[np.ndarray, float]:
    """Newton-Raphson logistic regression; returns coefficients and log-likelihood."""
    b = np.zeros(x.shape[1])
    for _ in range(iters):
        eta = np.clip(x @ b, -30, 30)
        p = 1.0 / (1.0 + np.exp(-eta))
        w = np.maximum(p * (1 - p), 1e-9)
        h = x.T @ (x * w[:, None]) + 1e-8 * np.eye(x.shape[1])
        step = np.linalg.solve(h, x.T @ (y - p))
        b += step
        if np.abs(step).max() < 1e-8:
            break
    eta = np.clip(x @ b, -30, 30)
    return b, float(np.sum(y * eta - np.logaddexp(0.0, eta)))


def benjamini_hochberg(p: np.ndarray, q: float) -> np.ndarray:
    p = np.asarray(p, float)
    m = len(p)
    order = np.argsort(p)
    ok = p[order] <= q * np.arange(1, m + 1) / m
    k = int(np.max(np.nonzero(ok)[0]) + 1) if ok.any() else 0
    out = np.zeros(m, bool)
    out[order[:k]] = True
    return out


def _flatten(items: np.ndarray, correct: np.ndarray, done: np.ndarray):
    u, _, k = items.shape
    sel = np.repeat(done[:, :, None], k, axis=2)
    user = np.broadcast_to(np.arange(u)[:, None, None], items.shape)[sel]
    return user, items[sel], correct[sel].astype(float)


def _lr_grouping(user, it, y, focal_user, pool: int, anchors: set[int]) -> list[dict]:
    u = len(focal_user)
    f = focal_user[user].astype(float)
    rows = []
    for i in range(pool):
        use = np.isin(it, sorted(anchors - {i}))
        tot = np.bincount(user[use], weights=y[use], minlength=u)
        cnt = np.bincount(user[use], minlength=u)
        theta = np.log((tot + 0.5) / (cnt - tot + 0.5))
        theta = (theta - theta.mean()) / theta.std()
        m = it == i
        th, yy, ff = theta[user[m]], y[m], f[m]
        one = np.ones_like(th)
        _, l0 = _logit_fit(np.column_stack([one, th]), yy)
        b1, l1 = _logit_fit(np.column_stack([one, th, ff]), yy)
        b2, l2 = _logit_fit(np.column_stack([one, th, ff, th * ff]), yy)
        rows.append(
            {
                "item": i,
                "p": float(chi2.sf(max(2 * (l2 - l0), 0.0), 2)),
                "p_uniform": float(chi2.sf(max(2 * (l1 - l0), 0.0), 1)),
                "uniform_logit": float(b1[2]),
                "nonuniform_logit": float(b2[3]),
                "ets_delta": float(-2.35 * b1[2]),
                "n": int(m.sum()),
            }
        )
    return rows


def _lr_family(items, correct, done, groups: dict[str, np.ndarray], pool: int, planted: np.ndarray, planted_group: str) -> dict:
    user, it, y = _flatten(items, correct, done)
    anchors = {g: set(range(pool)) for g in groups}
    flagged_prev: dict[str, set[int]] | None = None
    rounds = 0
    for rounds in range(1, MAX_PURIFY + 1):
        rows = []
        for g, focal in groups.items():
            rows += [{"grouping": g, **r} for r in _lr_grouping(user, it, y, focal, pool, anchors[g])]
        significant = benjamini_hochberg(np.array([r["p"] for r in rows]), LR_Q)
        for r, s in zip(rows, significant):
            r["significant"] = bool(s)
            r["flagged"] = bool(s and abs(r["ets_delta"]) >= MIN_ETS_DELTA)
        flagged = {g: {r["item"] for r in rows if r["grouping"] == g and r["flagged"]} for g in groups}
        if flagged == flagged_prev:
            break
        flagged_prev = flagged
        anchors = {g: set(range(pool)) - flagged[g] for g in groups}
    for r in rows:
        r["planted"] = bool(r["item"] in planted and r["grouping"] == planted_group)
    return _summarize(rows, planted, planted_group, extra={"purification_rounds": rounds})


def _mh_family(items, correct, done, groups: dict[str, np.ndarray], pool: int, planted: np.ndarray, planted_group: str) -> dict:
    u, _, k = items.shape
    sel = np.repeat(done[:, :, None], k, axis=2)
    user = np.broadcast_to(np.arange(u)[:, None, None], items.shape)[sel]
    it, y = items[sel], correct[sel]
    rows = []
    for gname, focal_user in groups.items():
        total = correct.sum(2, keepdims=True)
        rest = (np.broadcast_to(total, correct.shape) - correct)[sel]
        f = focal_user[user]
        for i in range(pool):
            m = it == i
            res = mantel_haenszel(y[m], f[m], rest[m])
            rows.append({"item": i, "grouping": gname, "planted": bool(i in planted and gname == planted_group), "flagged": bool(res["p"] < MH_ALPHA / pool), **res})
    return _summarize(rows, planted, planted_group)


def _summarize(rows: list[dict], planted: np.ndarray, planted_group: str, extra: dict | None = None) -> dict:
    planted_rows = [x for x in rows if x["planted"]]
    other = [x for x in rows if not x["planted"]]
    found = sum(x["flagged"] for x in planted_rows)
    false_flags = sum(x["flagged"] for x in other)
    rate = false_flags / len(other) if other else 0.0
    return {
        "planted_items": [int(i) for i in planted],
        "planted_grouping": planted_group,
        "found": int(found),
        "planted": len(planted_rows),
        "false_flags": int(false_flags),
        "tests_unbiased": len(other),
        "false_flag_rate": rate,
        "pass": found >= 2 and rate <= 0.05,
        **(extra or {}),
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
    primary = {name: _lr_family(a, b, done, groups, pool, pl, pg) for name, (a, b, pool, pl, pg) in fams.items()}
    mh = {name: _mh_family(a, b, done, groups, pool, pl, pg) for name, (a, b, pool, pl, pg) in fams.items()}
    return {
        **primary,
        "method": (
            "Logistic-regression DIF (amendment A4): matched on each person's ability across the whole baseline burst, "
            f"iterative purification, 2-df likelihood-ratio test, Benjamini-Hochberg q = {LR_Q}, flag only if ETS |delta| >= {MIN_ETS_DELTA}."
        ),
        "preregistered_mh": {
            "label": f"Pre-registered method (Mantel-Haenszel, per-session rest score, alpha {MH_ALPHA}, Bonferroni). Superseded by A4; shown for transparency.",
            **{name: {k: v for k, v in res.items() if k != "items"} for name, res in mh.items()},
        },
    }
