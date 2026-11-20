# 00 — Project Overview: Baseline

## 1. One-line pitch

Baseline turns short everyday-life tasks into a **personal brain-health trajectory**. It adjusts for language, education, mood, sleep and digital familiarity, and **shows with evidence** how well it detects real change in the local population before anyone relies on it.

## 2. The problem (from the challenge)

- Cognitive and functional change is gradual and often blamed on normal ageing.
- One-off scores mislead because language, education, culture, sensory impairment, mood and digital familiarity all shift them.
- Tools not validated locally cause false positives, anxiety, or false reassurance.
- Abu Dhabi data (screening, records, genomics, wearables) is fragmented, so change over time is hard to see.
- Uncertainty about what a finding means delays primary or specialist assessment.
  - Local benchmark: in an Al Ain Hospital review of 825 dementia patients (63% Emirati), the mean time from symptom onset to diagnosis was 34.7 months (median 24).

## 3. Our chosen focus

**Requirement 6, validation and local population performance.** We measure completion, test-retest reliability, change-detection sensitivity and specificity, false-referral burden and time to assessment, split by language, age and education. We use a simulated cohort plus a small pilot, both clearly labeled.

We still build a thin but real version of requirements 1 to 5, because validation needs an instrument to validate. The pitch story is: *"Here is a culturally fair monitoring tool, and here is honest proof of how well it performs, and for whom."*

## 4. System components

| Component | What it does | Requirement |
|---|---|---|
| **Scenario task engine** | Everyday scenes (family-gathering shopping, medication refill, bill payment, errands and way-finding, voice message, quick response). Each scene targets one construct. Parallel forms and adaptive difficulty. | 1 |
| **Context check-in** | About 20 seconds: sleep, mood, stress, pain or illness, hearing and vision today, loneliness, fasting or Ramadan, medication change. Covariates, not diagnoses. | 1, 2, 3 |
| **Fair (psychometric layer)** | Item calibration, DIF checks by language, education and digital familiarity, demographically adjusted reference ranges. | 1, 6 |
| **Fingerprint (personal model)** | Bayesian within-person model: level, practice or learning effect, variability (intra-individual variability), forgetting. Produces change estimates with uncertainty. | 2 |
| **State engine** | Stable, Watch, Review, plus an Urgent bypass for red flags. Explicit, versioned thresholds with hysteresis. | 2, 5 |
| **Risk context** | Lancet 2024 modifiable factors, family history, informant reports (AD8, IQCODE-type), Device Hub readings, optional Weqaya or Malaffi summaries and genomics (synthetic in the demo). | 3 |
| **Action layer** | Prevention plan (FINGER/POINTER-style), retest scheduling, reversible-cause routing, referral packet. | 4 |
| **Clinician console** | Review queue, trajectory with uncertainty, confounders, informant input, accept, override or refer, outcome capture. | 5, 6 |
| **Noor (companion agent)** | Guides onboarding, hosts tasks with a fixed script, runs conversational check-ins, logs readings, narrates the weekly story, drafts packets. It only uses engine outputs. | 1, 4, 5 |
| **Validation Lab** | Simulated cohort generator, metric pipeline, fairness dashboard, pilot data intake, versioned validation report. | 6 |

## 5. System workflow

1. **Consent and onboarding.** Language choice, granular consent, a 3-question digital-familiarity check, and a sensory check (can you hear and see the task comfortably?).
2. **Context intake.** Lancet factors, family history, optional imports (Device Hub, synthetic Weqaya or Malaffi bundle, genomics off by default).
3. **Baseline burst.** About 7 days of short sessions, with a practice round that is not scored. The first sessions estimate the practice curve, not the true level.
4. **Ongoing monitoring.** Daily micro-session plus check-in, or periodic bursts (for example 5 days every 3 months). Monthly informant check.
5. **Scoring.** Raw task metrics are scored with Fair adjustments, then update the personal model.
6. **State decision.** Stable, Watch or Review, plus Urgent for red flags. The rules are in `phases/phase-2-change-engine.md`.
7. **Actions.** Prevention tips, retest, confounder routing (sleep, mood, hearing, vision, medication), or clinician packet.
8. **Clinician loop.** Review, decision and outcome flow back into the Validation Lab as real-world labels.
9. **Validation Lab.** Continuously reports metrics by segment, and its results set threshold versions.

## 6. User journey (demo persona: Khalid, 58, with his daughter Mariam)

| When | What happens |
|---|---|
| Day 0 | Opens link, chooses Arabic. Noor greets him by voice. Large text and audio are on by default. Granular consent. Digital-familiarity and sensory check. |
| Day 0–1 | Short intake by conversation with Noor: blood pressure, diabetes, sleep, hearing, vision, activity, family history. Device Hub shows a simulated BP cuff and sleep feed. A synthetic Weqaya summary is imported. Genomics stays off. |
| Days 1–7 | Two 3–4 minute scenarios daily, each with a practice round first. Mariam is invited as informant and completes a short questionnaire. Day 7: "Your personal baseline is set." No scary numbers. |
| Weeks 2–12 | One scenario a day, a 20-second check-in, a weekly voice message, and a monthly family check. Weekly plain-language story. Prevention plan updates. |
| Week 6 | Dip while sleep and mood are poor. State: **Watch (context-explained)**. Sleep routine suggested, retest scheduled. No referral. |
| Ramadan | Sleep timing shifts. The engine widens its expected range and does not flag. (Cultural covariate.) |
| Month 5 | Decline persists across two bursts, variability rises, and Mariam reports new trouble with bills. State: **Review**. Calm message, not a diagnosis. Khalid chooses to share a packet with his primary care clinic. |
| Clinician | Sees trajectory, uncertainty, confounders, informant input, risk context. Accepts and refers to geriatrics or neurology, and records the outcome. |
| Always | Khalid can export or delete his data. Mariam sees only what he allows. Red-flag symptoms trigger scripted urgent-care guidance at any point. |

## 7. What is real and what is simulated

| Real (built and working) | Simulated (clearly labeled) | Roadmap (proposal only) |
|---|---|---|
| PWA, task engine, check-in, change engine, state rules, clinician console, Noor with guardrails, Validation Lab pipeline, mini-pilot reliability and usability data | Longitudinal cohort (literature- and Weqaya-parameterized), Weqaya and Malaffi bundles, device feeds, genomics input, clinician outcomes for simulated users | Prospective validation with Department of Health, UAEHFS or hospital partners; HealthKit and Health Connect via Capacitor; more expatriate languages; real Emirati norms |

## 8. Proposed stack

- **Front end:** Next.js, TypeScript, PWA (service worker for offline tasks), i18n with full right-to-left support for Arabic.
- **Engine and Lab:** Python with FastAPI. NumPy, SciPy, pandas and statsmodels. A Kalman-filter state-space model for real-time scoring, which is fast, Bayesian and returns uncertainty without MCMC. PyMC is optional, for offline change-point analysis in the Lab.
- **Agent:** LLM with tool calling, strict tool contract, template library for Review and Urgent messages. Speech-to-text and text-to-speech with typed fallback.
- **Data:** Postgres or SQLite for the demo. Every record carries `source`, `is_synthetic`, `consent_scope`.
