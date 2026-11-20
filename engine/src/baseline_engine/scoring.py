"""Turn app sessions into family scores, context flags and covariates (one user, U = 1)."""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime

import numpy as np

from .config import CONTEXT_FACTORS, COVARIATES, FAMILIES
from .core import EngineInput
from .schemas import CheckIn, InformantReport, Session, TaskResult

EXEC_REFERENCE_SECONDS = 30.0
EXEC_TIME_WEIGHT = 0.1


def _usable(task: TaskResult) -> bool:
    return not task.practice and not task.validity


def memory_score(tasks: list[TaskResult]) -> float | None:
    """Mean discrimination (hit rate minus false-alarm rate) over immediate and delayed recall."""
    vals = [t.metrics.get("discrimination") for t in tasks if t.family == "shopping" and _usable(t)]
    vals = [v for v in vals if v is not None]
    return float(np.mean(vals)) if vals else None


def speed_score(tasks: list[TaskResult]) -> float | None:
    """Negative mean log median reaction time (seconds); higher is faster."""
    logs: list[float] = []
    for t in tasks:
        if t.family != "quick" or not _usable(t):
            continue
        for key in ("simpleMedianRt", "choiceMedianRt"):
            v = t.metrics.get(key)
            if v is not None and v > 0:
                logs.append(math.log(v / 1000.0))
    return -float(np.mean(logs)) if logs else None


def executive_score(tasks: list[TaskResult]) -> float | None:
    """Pill-organizer cell accuracy, with a small penalty for taking longer than the reference time."""
    for t in tasks:
        if t.family != "medication" or not _usable(t):
            continue
        acc, ms = t.metrics.get("cellAccuracy"), t.metrics.get("timeMs")
        if acc is None or ms is None or ms <= 0:
            continue
        return float(acc - EXEC_TIME_WEIGHT * math.log(ms / 1000.0 / EXEC_REFERENCE_SECONDS))
    return None


def family_scores(session: Session) -> dict[str, float | None]:
    return {
        "memory": memory_score(session.tasks),
        "speed": speed_score(session.tasks),
        "executive": executive_score(session.tasks),
    }


def context_flags(c: CheckIn | None) -> dict[str, bool]:
    if c is None:
        return {k: False for k in CONTEXT_FACTORS}
    return {
        "poor_sleep": c.sleep_hours < 5 or c.sleep_quality <= 2,
        "ill": c.ill,
        "low_mood": c.mood <= 2,
        "high_stress": c.stress >= 4,
        "fasting": c.fasting,
        "new_medication": c.new_medication,
        "sensory_problem": not (c.hearing_ok and c.vision_ok),
    }


def covariate_flags(s: Session) -> dict[str, bool]:
    return {"assisted": s.assisted, "phone": s.device_type == "phone", "voice_input": s.input_mode != "tap"}


@dataclass
class Slot:
    at: datetime
    session: Session | None
    informant: InformantReport | None


def build_input(sessions: list[Session], informant: list[InformantReport]) -> tuple[EngineInput, list[Slot]]:
    """Order completed sessions and informant reports in time; one slot each."""
    slots = [
        Slot(s.started_at, s, None)
        for s in sessions
        if s.completed or (s.check_in is not None and s.check_in.red_flag)
    ]
    slots += [Slot(r.at, None, r) for r in informant]
    slots.sort(key=lambda x: x.at)
    inp = EngineInput.empty(1, max(len(slots), 1))
    if not slots:
        return inp, slots
    t0 = slots[0].at
    for i, slot in enumerate(slots):
        inp.day[0, i] = (slot.at - t0).total_seconds() / 86400.0
        if slot.informant is not None:
            inp.informant_concern[0, i] = slot.informant.new_difficulty
            continue
        s = slot.session
        assert s is not None
        scores = family_scores(s)
        inp.scores[0, i] = [np.nan if scores[f] is None else scores[f] for f in FAMILIES]
        ctx = context_flags(s.check_in)
        inp.context[0, i] = [ctx[c] for c in CONTEXT_FACTORS]
        cov = covariate_flags(s)
        inp.covariates[0, i] = [cov[k] for k in COVARIATES]
        inp.red_flag[0, i] = bool(s.check_in and s.check_in.red_flag)
    return inp, slots
