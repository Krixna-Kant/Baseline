"""Versioned engine configuration.

Every number that changes a state decision lives here, so a decision can always be traced
to a threshold version. Phase 3 (Validation Lab) produces v1 by the pre-registered rule in
docs/validation-protocol.md section 5.2; nothing else should edit these values.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field, replace

FAMILIES: tuple[str, ...] = ("memory", "speed", "executive")

CONTEXT_FACTORS: tuple[str, ...] = (
    "poor_sleep",
    "ill",
    "low_mood",
    "high_stress",
    "fasting",
    "new_medication",
    "sensory_problem",
)

COVARIATES: tuple[str, ...] = ("assisted", "phone", "voice_input")


@dataclass(frozen=True)
class EngineConfig:
    threshold_version: str = "v0"

    # Personal baseline
    n_baseline: int = 14
    practice_tau: float = 3.0
    """Exposure constant (sessions) of the exponential practice curve."""
    practice_max_sd: float = 2.0
    """Upper clamp on the fitted practice gain, in prior within-person SDs."""
    prior_sd: dict[str, float] = field(
        default_factory=lambda: {"memory": 0.15, "speed": 0.10, "executive": 0.15}
    )
    """Prior within-person session SD per family, in raw score units."""
    prior_df: float = 6.0
    baseline_var_factor: float = 1.5
    """Baseline estimate variance = factor / n_baseline (SD units); >1 because the practice term is also estimated."""

    # Local-level filter (all in personal SD units)
    process_var_per_day: float = 0.004
    initial_level_var: float = 0.05
    winsor_z: float = 4.0

    # Composite
    weights: dict[str, float] = field(
        default_factory=lambda: {"memory": 1 / 3, "speed": 1 / 3, "executive": 1 / 3}
    )
    reliability_weighting: bool = False
    """Scale each family's weight by prior SD / personal SD, so a family that is noisy for this person counts less."""
    reliability_power: float = 1.0

    # Fair layer: per-session covariate offsets (SD units) removed before modelling
    covariate_effects: dict[str, dict[str, float]] = field(
        default_factory=lambda: {
            "assisted": {"memory": 0.2, "speed": 0.0, "executive": 0.3},
            "phone": {"memory": 0.0, "speed": -0.2, "executive": 0.0},
            "voice_input": {"memory": 0.0, "speed": -0.3, "executive": 0.0},
        }
    )

    # Context effects (SD units, negative = expected to lower performance)
    context_effects: dict[str, float] = field(
        default_factory=lambda: {
            "poor_sleep": -0.30,
            "ill": -0.40,
            "low_mood": -0.25,
            "high_stress": -0.15,
            "fasting": -0.20,
            "new_medication": -0.20,
            "sensory_problem": -0.30,
        }
    )
    context_explain_level: float = 0.5
    """Recent share of sessions with a context factor needed to call a drop context-explained."""
    context_smoothing: float = 0.35

    # State rules v0
    watch_z: float = -1.645
    rapid_z: float = -2.33
    rapid_window_days: float = 28.0
    retest_sessions: int = 4
    exit_watch_sessions: int = 2
    informant_window_days: float = 90.0
    gap_days: float = 14.0

    # Slow-change rule: one-sided CUSUM on the per-session standardized composite residual.
    # Accumulates small persistent drops that never cross watch_z; reaching cusum_h goes to Review.
    noise_threshold_power: float = 0.0
    """Per-person threshold = watch_z x (mean prior SD / personal SD) ** power. 0 = same SD-unit bar for all;
    above 0 lowers the bar for people whose measured noise is high (uses measured noise, never demographics)."""

    slow_rule: bool = False
    cusum_k: float = 0.5
    """Allowance per session (standardized units); drops smaller than this do not accumulate."""
    cusum_h: float = 12.0

    # Switches used by Lab ablations
    two_stage: bool = True
    use_context: bool = True
    use_practice: bool = True
    use_informant: bool = True
    use_covariates: bool = True

    def with_(self, **changes: object) -> "EngineConfig":
        return replace(self, **changes)  # type: ignore[arg-type]


V0_CONFIG = EngineConfig()
"""Provisional thresholds used before the Validation Lab ran."""

V1_CONFIG = V0_CONFIG.with_(threshold_version="v1", watch_z=-2.5, rapid_z=-3.2, two_stage=True)
"""Chosen by the pre-registered rule (fallback A3.2) in the protocol run, seed 20261120; see docs/validation-report.md."""

V2_CANDIDATE = V1_CONFIG.with_(threshold_version="v2-candidate", noise_threshold_power=0.5)
"""Lab amendment A5 lever candidate (noise-aware threshold, power 0.5, Watch z -2.5). Not the default until the
held-out check in docs/validation-report.md passes; select with BASELINE_THRESHOLDS=v2-candidate to compare."""

CONFIGS = {c.threshold_version: c for c in (V0_CONFIG, V1_CONFIG, V2_CANDIDATE)}

DEFAULT_CONFIG = CONFIGS[os.environ.get("BASELINE_THRESHOLDS", "v1")]
