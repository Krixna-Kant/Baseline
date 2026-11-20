"""Request and response models. Field names mirror web/src/lib/types.ts (camelCase on the wire)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class Wire(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="ignore")


class CheckIn(Wire):
    sleep_hours: float
    sleep_quality: int
    mood: int
    stress: int
    ill: bool
    hearing_ok: bool
    vision_ok: bool
    loneliness: int
    fasting: bool
    new_medication: bool
    caffeine: bool
    red_flag: bool


class TaskResult(Wire):
    family: Literal["shopping", "quick", "medication"]
    phase: Literal["immediate", "delayed"] | None = None
    form_id: str
    practice: bool
    started_at: datetime
    ended_at: datetime
    metrics: dict[str, float | None]
    validity: list[str] = Field(default_factory=list)


class Session(Wire):
    id: str
    type: Literal["baseline", "daily", "retest"]
    started_at: datetime
    ended_at: datetime | None = None
    completed: bool
    device_type: Literal["phone", "tablet", "desktop"]
    input_mode: Literal["tap", "voice", "mixed"]
    assisted: bool
    check_in: CheckIn | None = None
    tasks: list[TaskResult] = Field(default_factory=list)
    is_synthetic: bool = False


class InformantReport(Wire):
    at: datetime
    new_difficulty: bool
    score: float | None = None


class EvaluateRequest(Wire):
    sessions: list[Session]
    informant: list[InformantReport] = Field(default_factory=list)
    now: datetime | None = None
    reviewed_at: datetime | None = None


class Interval(Wire):
    estimate: float
    low: float
    high: float
    z: float


class Driver(Wire):
    kind: Literal["family", "context", "informant"]
    key: str
    value: float | None = None


class Explanation(Wire):
    state: str
    previous_state: str | None
    rule_fired: str
    drivers: list[Driver]
    confounders_considered: list[str]
    composite: Interval | None
    families: dict[str, Interval]
    baseline_sessions: int
    baseline_needed: int
    days_since_last_session: float | None
    gap: bool
    next_step: str
    threshold_version: str
    engine_version: str
    decided_at: datetime


class TrajectoryPoint(Wire):
    session_id: str
    at: datetime
    state: str
    rule: str
    composite_z: float | None
    composite_level: float | None
    composite_se: float | None
    family_z: dict[str, float | None]
    scores: dict[str, float | None]


class EvaluateResponse(Wire):
    explanation: Explanation
    trajectory: list[TrajectoryPoint]
