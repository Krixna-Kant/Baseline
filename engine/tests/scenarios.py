"""Hand-made scenario builder: 7-day baseline burst (2 per day) then daily sessions."""

from __future__ import annotations

from collections.abc import Callable

import numpy as np

from baseline_engine.config import CONTEXT_FACTORS, DEFAULT_CONFIG, FAMILIES
from baseline_engine.core import EngineInput

SD = np.array([DEFAULT_CONFIG.prior_sd[f] for f in FAMILIES])
TRUE_LEVEL = np.array([0.6, 0.4, 0.8])

Effect = Callable[[float], float]


def schedule(days: int) -> np.ndarray:
    burst = np.repeat(np.arange(7.0), 2) + np.tile([0.0, 0.4], 7)
    return np.concatenate([burst, np.arange(7.0, 7.0 + days)])


def build(
    n_users: int = 1,
    days: int = 180,
    seed: int = 0,
    shift_sd: Effect = lambda d: 0.0,
    context: dict[str, Callable[[float], bool]] | None = None,
    stop_after: float | None = None,
) -> EngineInput:
    """Scores = level + practice gain (1 SD, tau 3) + shift(day) SD + N(0, 1 SD) noise."""
    rng = np.random.default_rng(seed)
    day = schedule(days)
    if stop_after is not None:
        day = day[day <= stop_after]
    t = len(day)
    inp = EngineInput.empty(n_users, t)
    inp.day[:] = day
    k = np.arange(t)
    practice = 1.0 - np.exp(-k / 3.0)
    shift = np.array([shift_sd(d) for d in day])
    noise = rng.standard_normal((n_users, t, len(FAMILIES)))
    inp.scores[:] = TRUE_LEVEL + (practice[:, None] + shift[:, None])[None] * SD + noise * SD
    for name, when in (context or {}).items():
        j = CONTEXT_FACTORS.index(name)
        inp.context[:, :, j] = np.array([when(d) for d in day])
    return inp
