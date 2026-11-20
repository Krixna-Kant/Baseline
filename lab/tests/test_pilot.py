import json
from datetime import datetime, timedelta, timezone

import numpy as np

from baseline_lab.pilot import EXPORT_KIND, load, participant, report, summarize


def _session(i: int, start: datetime, rng: np.random.Generator, skill: float) -> dict:
    t0 = start + timedelta(days=i, hours=9)
    task = lambda fam, metrics: {  # noqa: E731
        "family": fam,
        "formId": f"{fam}-{i}",
        "practice": False,
        "startedAt": t0.isoformat(),
        "endedAt": (t0 + timedelta(minutes=2)).isoformat(),
        "events": [],
        "metrics": metrics,
        "validity": [],
    }
    return {
        "id": f"s{i + 1}",
        "type": "baseline",
        "startedAt": t0.isoformat(),
        "endedAt": (t0 + timedelta(minutes=7)).isoformat(),
        "completed": True,
        "deviceType": "phone",
        "inputMode": "tap",
        "assisted": False,
        "tasks": [
            task("shopping", {"discrimination": 0.6 + 0.1 * skill + rng.normal(0, 0.1)}),
            task("quick", {"simpleMedianRt": 450 * np.exp(-0.1 * skill + rng.normal(0, 0.05)), "choiceMedianRt": 560.0}),
            task("medication", {"cellAccuracy": min(1.0, 0.85 + 0.05 * skill + rng.normal(0, 0.05)), "timeMs": 30000.0}),
        ],
        "source": "app",
        "isSynthetic": True,
        "schemaVersion": 1,
    }


def test_pilot_summary(tmp_path):
    rng = np.random.default_rng(3)
    start = datetime(2000, 1, 3, tzinfo=timezone.utc)
    for p in range(8):
        skill = rng.normal()
        days = 7 if p % 2 else 5
        d = {
            "kind": EXPORT_KIND,
            "schemaVersion": 1,
            "participant": f"P-{p}",
            "windowDays": 7,
            "bands": {"language": "ar" if p < 4 else "en", "ageBand": "50-64", "sex": "female", "education": "secondary", "familiarity": "medium"},
            "sessions": [_session(i, start, rng, skill) for i in range(days)],
        }
        (tmp_path / f"p{p}.json").write_text(json.dumps(d), encoding="utf-8")
    people = [participant(d) for d in load(tmp_path)]
    s = summarize(people)
    assert s["n"] == 8
    assert abs(s["completion_mean"] - (4 * 1.0 + 4 * 5 / 7) / 8) < 1e-9
    assert 6.5 < s["median_session_minutes"] < 7.5
    assert s["families"]["memory"]["within_person_sd"] > 0
    assert np.isfinite(s["composite_odd_even_icc"])
    assert "Pilot week report" in report(s)
