"""End to end through the HTTP API with app-shaped (camelCase) JSON."""

import math
from datetime import datetime, timedelta, timezone

import numpy as np
from fastapi.testclient import TestClient

from baseline_engine.api import app

from .scenarios import build

client = TestClient(app)
T0 = datetime(2026, 1, 1, 9, tzinfo=timezone.utc)

CHECKIN = {
    "sleepHours": 7,
    "sleepQuality": 4,
    "mood": 4,
    "stress": 2,
    "ill": False,
    "hearingOk": True,
    "visionOk": True,
    "loneliness": 1,
    "fasting": False,
    "newMedication": False,
    "caffeine": False,
    "redFlag": False,
}


def task(family, metrics, phase=None, at=T0):
    return {
        "family": family,
        "phase": phase,
        "formId": f"{family}-1",
        "practice": False,
        "startedAt": at.isoformat(),
        "endedAt": at.isoformat(),
        "events": [],
        "metrics": metrics,
        "validity": [],
    }


def app_sessions(days=60, seed=0, shift=lambda d: 0.0):
    """Translate the scenario builder's family scores into app task metrics."""
    inp = build(days=days, seed=seed, shift_sd=shift)
    out = []
    for i, d in enumerate(inp.day[0]):
        at = T0 + timedelta(days=float(d))
        mem, spd, exe = inp.scores[0, i]
        rt = 1000 * math.exp(-spd)
        out.append(
            {
                "id": f"s{i}",
                "type": "baseline" if i < 14 else "daily",
                "startedAt": at.isoformat(),
                "completed": True,
                "deviceType": "tablet",
                "inputMode": "tap",
                "assisted": False,
                "checkIn": CHECKIN,
                "tasks": [
                    task("shopping", {"discrimination": mem}, "immediate", at),
                    task("quick", {"simpleMedianRt": rt, "choiceMedianRt": rt}, at=at),
                    task("medication", {"cellAccuracy": exe, "timeMs": 30000}, at=at),
                    task("shopping", {"discrimination": mem}, "delayed", at),
                ],
            }
        )
    return out


def post(body):
    r = client.post("/evaluate", json=body)
    assert r.status_code == 200, r.text
    return r.json()


def test_building_during_baseline():
    res = post({"sessions": app_sessions(days=0)[:6]})
    ex = res["explanation"]
    assert ex["state"] == "building" and ex["ruleFired"] == "baseline_building"
    assert ex["baselineSessions"] == 6 and ex["baselineNeeded"] == 14
    assert ex["thresholdVersion"] == "v1"


def test_stable_with_explanation_and_trajectory():
    sessions = app_sessions(days=40, seed=3)
    res = post({"sessions": sessions, "now": (T0 + timedelta(days=48)).isoformat()})
    ex = res["explanation"]
    assert ex["state"] == "stable"
    assert set(ex["families"]) == {"memory", "speed", "executive"}
    assert ex["composite"]["low"] <= ex["composite"]["estimate"] <= ex["composite"]["high"]
    assert len(res["trajectory"]) == len(sessions)
    assert all(p["rule"] for p in res["trajectory"])


def test_long_gap_triggers_nudge():
    sessions = app_sessions(days=40, seed=3)
    res = post({"sessions": sessions, "now": (T0 + timedelta(days=80)).isoformat()})
    ex = res["explanation"]
    assert ex["gap"] is True
    assert ex["nextStep"] == "gentle_nudge_then_informant_check"


def test_red_flag_session_is_urgent_even_if_incomplete():
    sessions = app_sessions(days=20, seed=4)
    at = T0 + timedelta(days=30)
    sessions.append(
        {
            "id": "rf",
            "type": "daily",
            "startedAt": at.isoformat(),
            "completed": False,
            "deviceType": "phone",
            "inputMode": "tap",
            "assisted": False,
            "checkIn": {**CHECKIN, "redFlag": True},
            "tasks": [],
        }
    )
    ex = post({"sessions": sessions})["explanation"]
    assert ex["state"] == "urgent" and ex["ruleFired"] == "red_flag"
    assert ex["nextStep"] == "urgent_care_now"


def test_decline_plus_informant_goes_to_review():
    sessions = app_sessions(days=120, seed=6, shift=lambda d: -max(0.0, d - 30) / 30.0)
    informant = [{"at": (T0 + timedelta(days=45)).isoformat(), "newDifficulty": True}]
    ex = post({"sessions": sessions, "informant": informant})["explanation"]
    assert ex["state"] == "review"
    assert any(d["kind"] == "family" for d in ex["drivers"])


def test_sleep_context_is_listed_as_confounder():
    sessions = app_sessions(days=30, seed=7)
    for s in sessions[-3:]:
        s["checkIn"] = {**CHECKIN, "sleepHours": 3, "sleepQuality": 1}
    ex = post({"sessions": sessions})["explanation"]
    assert "poor_sleep" in ex["confoundersConsidered"]


def test_risk_context_never_changes_the_cognitive_state():
    """Phase 4 rule: risk factors, readings and genomics shape advice only, never the state."""
    sessions = app_sessions(days=90, seed=9, shift=lambda d: -max(0.0, d - 40) / 40.0)
    now = (T0 + timedelta(days=92)).isoformat()
    plain = post({"sessions": sessions, "now": now})
    loaded = post(
        {
            "sessions": sessions,
            "now": now,
            "risk": {"factors": {"hypertension": {"value": "yes"}, "diabetes": {"value": "yes"}}},
            "readings": [{"type": "bp", "values": {"systolic": 168, "diastolic": 101}}],
            "genomics": {"apoe4": "carrier"},
        }
    )
    for key in ("state", "ruleFired", "composite", "families", "drivers"):
        assert plain["explanation"][key] == loaded["explanation"][key]
    assert plain["trajectory"] == loaded["trajectory"]


def test_engine_matches_array_path():
    """Scoring app JSON gives the same family scores the scenario builder generated."""
    inp = build(days=5, seed=8)
    sessions = app_sessions(days=5, seed=8)
    traj = post({"sessions": sessions})["trajectory"]
    got = np.array([[p["scores"][f] for f in ("memory", "speed", "executive")] for p in traj])
    assert np.allclose(got, inp.scores[0], atol=1e-9)
