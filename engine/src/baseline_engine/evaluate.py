"""Single-user evaluation: app history in, state decision with explanation out.

Noor and the clinician console read this object; they never recompute a state.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone

import numpy as np

from . import __version__
from .config import CONTEXT_FACTORS, DEFAULT_CONFIG, FAMILIES, EngineConfig
from .core import RULE_NAMES, STATE_NAMES, Rule, State, run
from .schemas import (
    Driver,
    EvaluateRequest,
    EvaluateResponse,
    Explanation,
    Interval,
    TrajectoryPoint,
)
from .scoring import build_input, family_scores

NEXT_STEP = {
    State.BUILDING: "complete_baseline",
    State.STABLE: "normal_schedule",
    State.WATCH_CONTEXT: "retest_in_3_to_7_days",
    State.WATCH: "retest_burst_and_informant_check",
    State.REVIEW: "clinician_review",
    State.URGENT: "urgent_care_now",
}
CONFOUNDER_WINDOW_DAYS = 7.0


def _num(x: float) -> float | None:
    return None if x is None or not math.isfinite(x) else round(float(x), 4)


def _interval(level: float, var: float, z: float) -> Interval | None:
    if not (math.isfinite(level) and math.isfinite(var) and math.isfinite(z)):
        return None
    half = 1.96 * math.sqrt(var)
    return Interval(estimate=round(level, 4), low=round(level - half, 4), high=round(level + half, 4), z=round(z, 4))


def evaluate(req: EvaluateRequest, cfg: EngineConfig = DEFAULT_CONFIG) -> EvaluateResponse:
    now = req.now or datetime.now(timezone.utc)
    inp, slots = build_input(req.sessions, req.informant)
    if slots and req.reviewed_at is not None:
        inp.signoff_day = np.array([(req.reviewed_at - slots[0].at).total_seconds() / 86400.0])
    out = run(inp, cfg)

    session_idx = [i for i, s in enumerate(slots) if s.session is not None]
    trajectory = [
        TrajectoryPoint(
            session_id=slots[i].session.id,  # type: ignore[union-attr]
            at=slots[i].at,
            state=STATE_NAMES[State(out.state[0, i])],
            rule=RULE_NAMES[Rule(out.rule[0, i])],
            composite_z=_num(out.comp_z[0, i]),
            composite_level=_num(out.comp_level[0, i]),
            composite_se=_num(out.comp_se[0, i]),
            family_z={f: _num(out.fam_z[0, i, j]) for j, f in enumerate(FAMILIES)},
            scores=family_scores(slots[i].session),  # type: ignore[arg-type]
        )
        for i in session_idx
    ]

    last = len(slots) - 1
    state = State(out.state[0, last]) if slots else State.BUILDING
    rule = Rule(out.rule[0, last]) if slots else Rule.BASELINE_BUILDING
    prev = STATE_NAMES[State(out.state[0, last - 1])] if last >= 1 else None
    if rule == Rule.NO_SESSION:
        # Last slot was an informant report: report the rule that set the current state.
        decided = [i for i in range(last + 1) if out.rule[0, i] != Rule.NO_SESSION]
        if decided:
            rule = Rule(out.rule[0, decided[-1]])

    families: dict[str, Interval] = {}
    composite = None
    drivers: list[Driver] = []
    if slots:
        for j, f in enumerate(FAMILIES):
            iv = _interval(out.level[0, last, j], out.level_var[0, last, j], out.fam_z[0, last, j])
            if iv is not None:
                families[f] = iv
        cse = out.comp_se[0, last]
        composite = _interval(out.comp_level[0, last], cse * cse, out.comp_z[0, last])

        for f, iv in sorted(families.items(), key=lambda kv: kv[1].z):
            if iv.z < -1.0:
                drivers.append(Driver(kind="family", key=f, value=iv.z))

    last_day = inp.day[0, last] if slots else np.nan
    recent = [
        i for i in session_idx if math.isfinite(last_day) and inp.day[0, i] >= last_day - CONFOUNDER_WINDOW_DAYS
    ]
    confounders = sorted({c for i in recent for j, c in enumerate(CONTEXT_FACTORS) if inp.context[0, i, j]})
    for c in confounders:
        drivers.append(Driver(kind="context", key=c, value=cfg.context_effects[c]))
    informant_recent = [
        r for r in req.informant if r.new_difficulty and (now - r.at).days <= cfg.informant_window_days
    ]
    if informant_recent:
        drivers.append(Driver(kind="informant", key="new_functional_difficulty", value=None))

    last_session_at = max((s.started_at for s in req.sessions if s.completed), default=None)
    days_since = (now - last_session_at).total_seconds() / 86400.0 if last_session_at else None
    gap = days_since is not None and days_since > cfg.gap_days
    n_baseline = int(out.observed[0].sum()) if slots else 0

    next_step = NEXT_STEP[state]
    if gap and state in (State.STABLE, State.WATCH, State.WATCH_CONTEXT):
        next_step = "gentle_nudge_then_informant_check"

    explanation = Explanation(
        state=STATE_NAMES[state],
        previous_state=prev,
        rule_fired=RULE_NAMES[rule],
        drivers=drivers[:3],
        confounders_considered=confounders,
        composite=composite,
        families=families,
        baseline_sessions=min(n_baseline, cfg.n_baseline),
        baseline_needed=cfg.n_baseline,
        days_since_last_session=None if days_since is None else round(days_since, 2),
        gap=gap,
        next_step=next_step,
        threshold_version=cfg.threshold_version,
        engine_version=__version__,
        decided_at=now,
    )
    return EvaluateResponse(explanation=explanation, trajectory=trajectory)
