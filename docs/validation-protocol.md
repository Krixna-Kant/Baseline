# Validation Protocol v1.0 (pre-registered)

**Registered:** 2026-11-20, before any simulation was run or any engine code was written.
**Rule:** this file is frozen once committed. Changes go into a new section "Amendments" at the bottom, with date and reason. Results must say which protocol version they follow.

**Scope:** simulation-only validation of Baseline's change-detection and referral pipeline. No human participants. All results are labeled "Simulated: operating characteristics under stated assumptions." They are not clinical accuracy.

---

## 1. Questions we are answering

1. Do people complete the schedule? (completion, drop-out)
2. Are repeated measurements consistent in people who are not changing? (test-retest)
3. Does the system detect true decline, and how early? (sensitivity, lead time)
4. How often does it flag people who are not declining? (specificity, false-referral burden)
5. Does the two-stage gate reduce false referrals, and at what cost in delay?
6. Is performance similar across language, age, education and digital-familiarity groups? (fairness)
7. Can the item-bias (DIF) check find biased items that we deliberately plant?
8. How long from flag to review, and how does a modeled Baseline pathway compare with usual care?

## 2. Segments

| Variable | Levels |
|---|---|
| Language | Arabic, English |
| Age band | under 50, 50–64, 65–74, 75+ |
| Education | none or primary, secondary, tertiary |
| Digital familiarity | low, medium, high |
| Sex | female, male (reported, not used for fairness thresholds) |

Segments with fewer than 200 simulated users in a cell are reported but marked "low n."

## 3. Simulation design

### 3.1 Cohort
- **Size:** 10,000 synthetic users; 2 simulated years each; seed fixed and recorded.
- **Population mix:** parameterized from the evidence register (A2, A3, A7, A8, A9). Parameters live in one versioned config file with a source column for each value.

### 3.2 Ground truth (generator model, deliberately different from the detector)
Each user gets a true trajectory class:

| Class | Description | Share (default, varied in sensitivity analysis) |
|---|---|---|
| Stable | No true change | about 70% |
| Normal ageing drift | Slow, small age-related decline | about 15% |
| Slow decline | Linear decline beyond ageing | about 6% |
| Accelerating decline | Decline that speeds up | about 3% |
| Step drop | Sudden drop then plateau | about 1% |
| Transient dip | Temporary drop (illness, sleep) that recovers | about 5% |

Shares of decline classes rise with age and risk profile. "True decliners" for sensitivity = slow, accelerating and step classes. Normal ageing drift and transient dips count as **not** decliners (flagging them is a false referral).

Generator features the detector does **not** assume:
- Heavy-tailed session noise (Student-t), larger for low digital familiarity and age 75+.
- Person-specific practice curves with different shapes (exponential, power, none).
- Missing sessions more likely as true decline progresses.
- Floor and ceiling effects.
- Context effects (sleep, mood, illness, Ramadan) whose true size differs from what the detector assumes.
- Informant reports generated from true function with error (parameterized from E1, E2).
- Planted DIF: 3 items per P0 task family made harder for one language or education group.

### 3.3 Schedule
- 7-day baseline burst (2 sessions per day).
- Then daily micro-sessions or 5-day bursts every 3 months (both schedules run as separate arms).
- Monthly informant report (if an informant exists; 70% of users by default).

### 3.4 Clinical pathway model
- **Usual care:** referral is triggered when true impairment crosses a symptom threshold; onset-to-diagnosis delay sampled from a distribution fitted to the Al Ain figures (A1: mean 34.7, median 24 months).
- **Baseline pathway:** Review flag → simulated flag-to-review delay (default median 14 days) → assessment.
- Reported only as a labeled model comparison.

## 4. Metric definitions

| Metric | Exact definition |
|---|---|
| Completion | Completed sessions ÷ scheduled sessions; baseline-burst completion; drop-out = no session for 60+ days |
| Test-retest | ICC(2,1) of composite and of each family, among Stable users, between the two halves of the baseline burst and between consecutive bursts; Bland-Altman bias and 95% limits |
| Sensitivity (12 months) | True decliners reaching Review within 12 months of true change onset ÷ all true decliners whose onset was at least 12 months before the end of the simulation |
| Specificity (12 months) | Non-decliners with no Review in a 12-month window ÷ all non-decliners |
| Lead time | Time from true onset to Review, in decliners who were flagged; also time to Review versus time the usual-care model would have triggered |
| False-referral burden | False Reviews per 1,000 users per year; positive predictive value of Review |
| Flag-to-review time | Review flag to clinician decision (simulated delay; measured for real in the console demo) |
| Fairness gap | Largest between-group difference in sensitivity (equal-opportunity gap) and largest between-group ratio in false-referral rate, per segment variable |
| DIF detection | Planted biased items found (Mantel-Haenszel or logistic-regression DIF, alpha 0.01 after correction) ÷ planted items; false DIF flags among unbiased items |

All metrics are reported with 95% intervals (bootstrap over users, 1,000 resamples).

## 5. Thresholds

### 5.1 v0 (starting point, from Phase 2)
- Watch (unexplained): practice-adjusted reliable change z ≤ −1.645 on the composite, or on 2+ families, in one burst, with no context explanation.
- Review: Watch persists in the retest burst, or decline plus informant report of new difficulty, or z ≤ −2.33 within 4 weeks.
- Urgent: red flags, outside the model.

### 5.2 Rule for choosing v1 (fixed now)
Sweep the Watch threshold from z = −1.0 to −2.5 in steps of 0.1, with one-stage and two-stage gates. Choose the setting that:
1. keeps false referrals at or below **30 per 1,000 users per year**, and
2. keeps the sensitivity fairness gap at or below **0.10** and the false-referral ratio between any two groups at or below **1.5**, and
3. among those, has the **highest 12-month sensitivity**; ties go to shorter lead time.

If no setting meets constraints 1 and 2, we report the best available setting, state which constraint fails and for which group, and do **not** adjust the constraints after seeing results.

## 6. Pre-stated success criteria

| Criterion | Target |
|---|---|
| Composite test-retest ICC in Stable users | ≥ 0.75 (good) |
| 12-month specificity | ≥ 0.95 |
| False referrals | ≤ 30 per 1,000 users per year |
| Two-stage gate vs one-stage | Fewer false referrals, with median extra delay ≤ 30 days |
| Fairness | Gaps within section 5.2 limits |
| DIF | ≥ 2 of 3 planted items found per family, ≤ 5% false DIF flags |

Sensitivity has no pass mark; it is reported honestly at the chosen threshold.

## 7. Planned analyses
1. Main results at threshold v1, by segment.
2. One-stage vs two-stage gate.
3. Sensitivity analysis: noise ×0.5 and ×2; decline prevalence halved and doubled; practice effect ×0.5 and ×2; missingness off and doubled; context effects mis-specified by ±50%.
4. Ablations: no context adjustment; no practice modeling; no informant; no Fair-layer covariates.
5. Daily vs burst schedule.
6. Failure report: characteristics of missed decliners and of false Reviews.

## 8. Reporting rules
- First paragraph of every report states: simulated data, assumptions, not clinical accuracy.
- Every number carries an interval and the threshold version.
- The generator config, seed and code version are listed in the report.
- Low-n segments are marked.

## Amendments

**A1 (2026-11-20, before any simulation was run).** Source verification showed the Arabic IQCODE-16 accuracy (AUC 0.96) was measured for mild-to-moderate dementia, not early change. The informant generator therefore uses lower accuracy for early change than for established impairment, and this is varied in the sensitivity analysis. Weqaya priors use age-standardized or age-band rates rather than crude rates. No metric, threshold or success criterion changed.
