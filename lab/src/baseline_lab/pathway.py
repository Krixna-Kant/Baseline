"""Clinical pathway model (protocol 3.4, A2 item 6). A labeled model comparison, not an outcome study."""

from __future__ import annotations

import numpy as np
import pandas as pd

MONTH = 30.44


def pathway(df: pd.DataFrame, params: dict, seed: int = 5) -> dict:
    pw = params["pathway"]
    rng = np.random.default_rng(seed)
    d = df[df["eligible_sens"] > 0]
    n = len(d)
    onset = d["onset_day"].to_numpy()
    usual = onset + np.exp(rng.normal(pw["usual_care_mu_log_months"], pw["usual_care_sigma"], n)) * MONTH
    delay = np.exp(rng.normal(np.log(pw["review_delay_median_days"]), pw["review_delay_sigma"], n))
    review = d["review_day"].to_numpy()
    flagged = np.isfinite(review) & (review >= onset)
    baseline = np.where(flagged, np.minimum(usual, review + delay), usual)
    u_m = (usual - onset) / MONTH
    b_m = (baseline - onset) / MONTH
    saved = u_m - b_m
    return {
        "label": "Model comparison under stated assumptions; not observed outcomes.",
        "n_decliners": int(n),
        "usual_care_months_median": float(np.median(u_m)),
        "usual_care_months_iqr": [float(np.percentile(u_m, 25)), float(np.percentile(u_m, 75))],
        "baseline_months_median": float(np.median(b_m)),
        "baseline_months_iqr": [float(np.percentile(b_m, 25)), float(np.percentile(b_m, 75))],
        "assessed_within_12m_usual": float((u_m <= 12).mean()),
        "assessed_within_12m_baseline": float((b_m <= 12).mean()),
        "months_saved_median_if_flagged": float(np.median(saved[flagged])) if flagged.any() else float("nan"),
        "flag_to_review_days_median": float(np.median(delay)),
    }
