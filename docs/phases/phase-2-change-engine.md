# Phase 2 — Change Engine: Personal Baseline, Fair Layer and States

**Priority:** P0 · **Requirements:** 2, 5 (feeds 6) · **Depends on:** Phase 1 metric definitions · **Runs in parallel with:** Phase 3

## Goal
Turn a stream of task results and context into a personal trajectory with uncertainty, and a state (Stable, Watch, Review, Urgent) using explicit, versioned rules.

## Components

### 2.1 Fair layer (adjustment before modeling)
- Per-metric transformation to a common scale.
- Covariate adjustment for digital familiarity, input mode, assisted mode, device type, sensory check.
- Population reference ranges by age band, education and language: **secondary only,** labeled "provisional, not local norms."
- DIF check hooks: item-level results are stored so Phase 3 can flag biased items and down-weight them.

### 2.2 Fingerprint (personal model)
- **Real-time model:** state-space (Kalman filter) per metric with a level term, a practice term that decays with exposure, and context effects (sleep, mood, illness, fasting). Outputs current level, change from baseline, and an uncertainty interval.
- **Baseline:** set after the 7-day burst once the practice curve has flattened; stored with its own uncertainty.
- **Variability (IIV):** within-session reaction-time variability, compared to the person's own baseline and age band.
- **Learning:** practice gain during the baseline burst stored as a feature (supporting signal only).
- **Composite:** weighted combination across families, weights versioned and set in Phase 3.

### 2.3 State rules (thresholds v0, provisional, tuned in Phase 3)

| State | Rule (v0) | Action |
|---|---|---|
| **Stable** | Change from baseline within expected range after practice and context adjustment | Normal schedule |
| **Watch (context-explained)** | Drop beyond threshold, but a recorded context factor (poor sleep, illness, low mood, fasting) explains it | Confounder tip; retest in 3–7 days |
| **Watch (unexplained)** | Practice-adjusted reliable change z ≤ −1.645 on the composite, or on 2+ families, in one burst, with no context explanation | Retest burst (stage 1 of the gate) plus informant check |
| **Review** | Watch (unexplained) **persists** in the retest burst, **or** decline plus informant report of new functional difficulty, **or** a rapid drop (z ≤ −2.33 within 4 weeks) | Clinician review required; packet drafted; user offered sharing |
| **Urgent** | Red-flag symptom reported at any time (sudden confusion, weakness on one side, speech loss, severe headache, fall with head injury, thoughts of self-harm) | Scripted urgent-care guidance immediately; bypasses the model |

**Hysteresis:** leaving Watch needs 2 consecutive in-range sessions; leaving Review needs clinician sign-off. States never flip back and forth day to day.

**Missing data:** no session for longer than the set gap → gentle nudge, then an informant check-in. Long gaps are logged for the Lab.

### 2.4 Explanation output
Every state decision returns: state, rule fired, top 3 drivers, confounders considered, uncertainty interval, threshold version. Noor and the console only read this; they never recompute it.

### 2.5 Engine API (described, not coded yet)
`POST /sessions` (task results + check-in) · `GET /users/{id}/state` · `GET /users/{id}/trajectory` · `POST /users/{id}/informant` · `GET /users/{id}/explanation`

## Deliverables
- [ ] Fair layer with covariate adjustment and provisional reference ranges
- [ ] Per-metric state-space model with baseline and uncertainty
- [ ] State rules v0 as a versioned config
- [ ] Explanation object for every decision
- [ ] Unit tests with hand-made scenarios: stable person, sleep dip, Ramadan shift, slow decline, sudden drop, red flag, long gap

## Acceptance criteria
- All seven hand-made scenarios produce the expected state.
- No state change without an explanation object.
- The same inputs always give the same output (deterministic, versioned).

## Out of scope
Tuning thresholds (Phase 3), UI beyond a debug view.
