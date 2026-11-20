# Validation Report — threshold v1 (2026-11-20)

**Simulated data only.** Every number below describes how Baseline's change-detection and referral rules behave on a synthetic cohort of 10,000 people generated under stated assumptions (protocol v1.0, amendments A1, A2, A3). They are operating characteristics, **not clinical accuracy**. No real participants were involved. The generator was written to differ from the detector (heavy-tailed noise, varied practice curves, item-level floors and ceilings, mis-sized context effects, informative drop-out), but it is still a model and real people will differ.

Seed `20261120` · generator `gen-1.0` · engine `0.1.0` · 1000 bootstrap resamples · runtime 2551 s · intervals are 95% bootstrap over users.

## Pre-stated success criteria

| Criterion | Target | Result | Met |
|---|---|---|---|
| Composite test-retest ICC in Stable users | >= 0.75 (baseline halves and consecutive blocks) | 0.88 / 0.94 | Yes |
| 12-month specificity | >= 0.95 | 0.974 | Yes |
| False referrals per 1,000 person-years | <= 30 | 25.3 | Yes |
| Two-stage vs one-stage gate | fewer false referrals; median extra delay <= 30 days | 25.3 vs 58.7; +12 days | Yes |
| Fairness | sensitivity gap <= 0.10; false-referral ratio <= 1.5 | gap 0.12; ratio 1.47 | **No** |
| DIF | >= 2 of 3 planted items found per family; <= 5% false flags | shopping 3/3, 31 false; medication 3/3, 12 false | **No** |

Sensitivity has no pass mark; it is reported at the chosen threshold.

## Threshold v1

Chosen: **Watch z = -2.5**, rapid-drop z = -3.2, **two-stage gate**.
Rule applied: fallback (A3.2): no setting met all constraints; smallest worst fairness violation among settings within the false-referral limit.
Constraints not met at v1: sensitivity_gap:education, sensitivity_gap:familiarity.

| Gate | Watch z | Sensitivity 12 m | Specificity 12 m | False / 1,000 py | PPV | Median lead (days) | Worst sens. gap | Worst false ratio | Meets all |
|---|---|---|---|---|---|---|---|---|---|
| two-stage | -1.0 | 0.446 | 0.641 | 270.9 | 0.087 | 173 | 0.08 | 1.05 | No |
| two-stage | -1.1 | 0.458 | 0.686 | 241.3 | 0.102 | 174 | 0.11 | 1.05 | No |
| two-stage | -1.2 | 0.466 | 0.729 | 212.1 | 0.116 | 178 | 0.11 | 1.09 | No |
| two-stage | -1.3 | 0.471 | 0.768 | 187.5 | 0.131 | 184 | 0.08 | 1.08 | No |
| two-stage | -1.4 | 0.476 | 0.803 | 161.8 | 0.152 | 192 | 0.10 | 1.08 | No |
| two-stage | -1.5 | 0.476 | 0.833 | 140.0 | 0.171 | 198 | 0.12 | 1.11 | No |
| two-stage | -1.6 | 0.461 | 0.856 | 120.7 | 0.194 | 198 | 0.11 | 1.13 | No |
| two-stage | -1.7 | 0.460 | 0.880 | 102.5 | 0.220 | 213 | 0.13 | 1.11 | No |
| two-stage | -1.8 | 0.438 | 0.898 | 88.6 | 0.238 | 221 | 0.12 | 1.15 | No |
| two-stage | -1.9 | 0.422 | 0.915 | 75.8 | 0.266 | 223 | 0.14 | 1.16 | No |
| two-stage | -2.0 | 0.402 | 0.931 | 63.2 | 0.294 | 229 | 0.15 | 1.17 | No |
| two-stage | -2.1 | 0.384 | 0.943 | 54.0 | 0.322 | 241 | 0.12 | 1.19 | No |
| two-stage | -2.2 | 0.373 | 0.953 | 46.7 | 0.349 | 248 | 0.13 | 1.30 | No |
| two-stage | -2.3 | 0.359 | 0.960 | 38.6 | 0.389 | 251 | 0.11 | 1.35 | No |
| two-stage | -2.4 | 0.340 | 0.968 | 31.6 | 0.428 | 251 | 0.12 | 1.42 | No |
| two-stage | -2.5 | 0.326 | 0.974 | 25.3 | 0.477 | 256 | 0.12 | 1.47 | No |
| one-stage | -1.0 | 0.406 | 0.476 | 376.4 | 0.058 | 139 | 0.07 | 1.02 | No |
| one-stage | -1.1 | 0.409 | 0.521 | 349.3 | 0.063 | 154 | 0.07 | 1.02 | No |
| one-stage | -1.2 | 0.422 | 0.564 | 320.0 | 0.070 | 162 | 0.05 | 1.03 | No |
| one-stage | -1.3 | 0.441 | 0.612 | 290.6 | 0.080 | 170 | 0.08 | 1.03 | No |
| one-stage | -1.4 | 0.446 | 0.653 | 263.7 | 0.090 | 173 | 0.10 | 1.07 | No |
| one-stage | -1.5 | 0.465 | 0.692 | 236.0 | 0.104 | 175 | 0.09 | 1.12 | No |
| one-stage | -1.6 | 0.472 | 0.732 | 210.8 | 0.117 | 181 | 0.08 | 1.11 | No |
| one-stage | -1.7 | 0.483 | 0.769 | 184.1 | 0.135 | 184 | 0.10 | 1.13 | No |
| one-stage | -1.8 | 0.471 | 0.798 | 162.1 | 0.151 | 193 | 0.09 | 1.13 | No |
| one-stage | -1.9 | 0.458 | 0.827 | 141.6 | 0.169 | 197 | 0.09 | 1.12 | No |
| one-stage | -2.0 | 0.457 | 0.854 | 122.6 | 0.190 | 199 | 0.10 | 1.15 | No |
| one-stage | -2.1 | 0.449 | 0.876 | 105.2 | 0.215 | 207 | 0.09 | 1.10 | No |
| one-stage | -2.2 | 0.438 | 0.894 | 91.1 | 0.237 | 215 | 0.11 | 1.12 | No |
| one-stage | -2.3 | 0.422 | 0.910 | 78.4 | 0.263 | 219 | 0.14 | 1.18 | No |
| one-stage | -2.4 | 0.409 | 0.924 | 68.4 | 0.285 | 227 | 0.14 | 1.18 | No |
| one-stage | -2.5 | 0.403 | 0.936 | 58.7 | 0.311 | 240 | 0.11 | 1.23 | No |

## Main results at v1 (daily arm)

| Metric | Estimate (95% interval) |
|---|---|
| 12-month sensitivity | 0.326 (0.291–0.361) |
| 12-month specificity | 0.974 (0.971–0.978) |
| False Reviews per 1,000 person-years | 25.3 (23.0–27.7) |
| Positive predictive value of Review | 0.477 (0.439–0.512) |
| Median lead time, onset to Review (days) | 256 (237–276) |
| Session completion | 0.537 (0.532–0.542) |
| Baseline-burst completion | 0.930 (0.929–0.932) |
| Drop-out (no session for 60+ days) | 0.434 (0.424–0.444) |

Eligible decliners: 635 of 10,000 users.

## Results by segment

Low n: fewer than 200 users, or fewer than 50 eligible decliners for sensitivity (A3).

| Variable | Group | Users | Sensitivity | Specificity | False / 1,000 py | Completion | Note |
|---|---|---|---|---|---|---|---|
| language | ar | 6,013 | 0.33 (0.28–0.38) | 0.973 (0.969–0.977) | 26.2 (23.1–29.4) | 0.54 (0.53–0.54) |  |
| language | en | 3,987 | 0.32 (0.27–0.37) | 0.976 (0.970–0.980) | 23.9 (20.1–27.6) | 0.54 (0.53–0.55) |  |
| age_band | 50-64 | 3,968 | 0.33 (0.26–0.40) | 0.977 (0.972–0.982) | 24.7 (21.1–28.9) | 0.55 (0.54–0.56) |  |
| age_band | 65-74 | 2,541 | 0.36 (0.30–0.42) | 0.969 (0.961–0.976) | 27.6 (22.8–32.7) | 0.52 (0.51–0.53) |  |
| age_band | 75+ | 1,550 | 0.29 (0.22–0.34) | 0.982 (0.974–0.989) | 19.3 (14.0–24.8) | 0.49 (0.48–0.50) |  |
| age_band | <50 | 1,941 | 0.34 (0.19–0.52) | 0.971 (0.964–0.978) | 28.1 (22.6–34.2) | 0.57 (0.56–0.58) | low n (decliners) |
| education | none_primary | 2,625 | 0.27 (0.21–0.33) | 0.975 (0.969–0.981) | 24.7 (20.0–29.6) | 0.50 (0.49–0.51) |  |
| education | secondary | 4,181 | 0.33 (0.28–0.39) | 0.973 (0.968–0.978) | 26.6 (22.9–30.7) | 0.54 (0.53–0.54) |  |
| education | tertiary | 3,194 | 0.39 (0.32–0.47) | 0.975 (0.969–0.981) | 24.0 (19.9–28.4) | 0.57 (0.56–0.58) |  |
| familiarity | high | 2,823 | 0.39 (0.31–0.47) | 0.969 (0.962–0.975) | 30.8 (26.2–36.1) | 0.61 (0.60–0.62) |  |
| familiarity | low | 3,294 | 0.28 (0.22–0.33) | 0.979 (0.974–0.984) | 21.0 (17.3–25.1) | 0.47 (0.46–0.47) |  |
| familiarity | medium | 3,883 | 0.35 (0.29–0.41) | 0.974 (0.968–0.980) | 24.9 (21.1–29.1) | 0.55 (0.54–0.55) |  |
| sex | female | 4,999 | 0.34 (0.28–0.39) | 0.975 (0.970–0.979) | 24.7 (21.5–28.2) | 0.54 (0.53–0.55) |  |
| sex | male | 5,001 | 0.32 (0.27–0.37) | 0.974 (0.969–0.979) | 25.8 (22.3–29.4) | 0.53 (0.53–0.54) |  |

## Fairness (section 5.2 constraints)

| Variable | Sensitivity gap (limit 0.10) | False-referral ratio (limit 1.5) | Excluded (low n) |
|---|---|---|---|
| language | 0.01  | 1.10  | — |
| age_band | 0.08  | 1.45  | <50 (sensitivity) |
| education | 0.12 **over** | 1.11  | — |
| familiarity | 0.11 **over** | 1.47  | — |

## One-stage vs two-stage gate (same Watch z)

| Gate | Sensitivity | Specificity | False / 1,000 py | Median lead (days) |
|---|---|---|---|---|
| one-stage | 0.403 (0.365–0.440) | 0.936 (0.931–0.941) | 58.7 (55.1–62.2) | 240 (224–253) |
| two-stage | 0.326 (0.291–0.361) | 0.974 (0.971–0.978) | 25.3 (23.0–27.7) | 256 (237–276) |

Median extra delay from the retest stage, in decliners detected under both gates: **12 days** (n = 198).

## Test-retest reliability (Stable users)

| Comparison | Measure | ICC(2,1) (95% interval) | Bland-Altman bias | 95% limits of agreement | n |
|---|---|---|---|---|---|
| baseline halves | composite | 0.88 (0.88–0.89) | 0.19 | -0.54 to 0.93 | 6,800 |
| baseline halves | memory | 0.83 (0.82–0.84) | 0.20 | -0.93 to 1.33 | 6,800 |
| baseline halves | speed | 0.86 (0.85–0.86) | 0.21 | -0.82 to 1.23 | 6,800 |
| baseline halves | executive | 0.77 (0.76–0.78) | 0.18 | -1.19 to 1.55 | 6,800 |
| consecutive blocks | composite | 0.94 (0.94–0.94) | 0.02 | -0.54 to 0.58 | 6,711 |
| consecutive blocks | memory | 0.89 (0.89–0.90) | 0.03 | -0.87 to 0.93 | 6,711 |
| consecutive blocks | speed | 0.91 (0.91–0.92) | 0.02 | -0.82 to 0.86 | 6,711 |
| consecutive blocks | executive | 0.85 (0.84–0.86) | 0.01 | -1.06 to 1.08 | 6,711 |

Units are between-person SDs. Baseline halves include the practice gain, so their bias is expected to be positive.

## Item bias (DIF) check

Mantel-Haenszel, rest-score strata, alpha 0.01 (Bonferroni within family), baseline-burst sessions.

| Family | Planted (grouping) | Found | False flags / unbiased tests | Met |
|---|---|---|---|---|
| shopping | items [1, 3, 12] (language) | 3 of 3 | 31 / 57 (54.4%) | **No** |
| medication | items [7, 11, 13] (education) | 3 of 3 | 12 / 27 (44.4%) | **No** |

_Exploratory, not pre-registered: two-step MH purification (items flagged in step 1 removed from the matching score)._

| Family | Found | False flags / unbiased tests | Would meet criterion |
|---|---|---|---|
| shopping | 3 of 3 | 30 / 57 (52.6%) | No |
| medication | 3 of 3 | 12 / 27 (44.4%) | No |

## Time to assessment (pathway model)

_Model comparison under stated assumptions; not observed outcomes._ Usual care: onset-to-diagnosis delay fitted to the Al Ain study (median 24, mean 34.7 months). Baseline: Review flag, then a median 15-day flag-to-review delay; people not flagged follow usual care.

| Pathway | Median months from onset to assessment (IQR) | Assessed within 12 months |
|---|---|---|
| Usual care (model) | 23.5 (13.2–43.2) | 22% |
| With Baseline (model) | 13.1 (8.7–25.5) | 45% |

## Ablations (each layer removed at v1)

| Model | Sensitivity | Specificity | False / 1,000 py | PPV | Median lead (days) |
|---|---|---|---|---|---|
| full model | 0.326 | 0.974 | 25.3 | 0.477 | 256 |
| no context adjustment | 0.357 | 0.950 | 48.4 | 0.324 | 259 |
| no practice modelling | 0.228 | 0.994 | 7.5 | 0.718 | 283 |
| no informant | 0.310 | 0.978 | 21.8 | 0.505 | 262 |
| no Fair-layer covariates | 0.326 | 0.974 | 26.0 | 0.471 | 253 |

## Sensitivity analysis (5,000 users per scenario, v1 thresholds)

| Scenario | Sensitivity | Specificity | False / 1,000 py | PPV | Median lead (days) | Completion |
|---|---|---|---|---|---|---|
| baseline assumptions | 0.325 | 0.976 | 24.7 | 0.467 | 255 | 0.54 |
| noise x0.5 | 0.437 | 0.982 | 23.5 | 0.537 | 239 | 0.54 |
| noise x2 | 0.179 | 0.967 | 28.1 | 0.322 | 241 | 0.54 |
| decline prevalence halved | 0.312 | 0.976 | 25.3 | 0.279 | 247 | 0.54 |
| decline prevalence doubled | 0.361 | 0.976 | 22.2 | 0.684 | 250 | 0.53 |
| practice effect x0.5 | 0.351 | 0.969 | 32.5 | 0.415 | 250 | 0.54 |
| practice effect x2 | 0.268 | 0.985 | 15.9 | 0.522 | 286 | 0.54 |
| missingness off | 0.603 | 0.969 | 28.2 | 0.543 | 266 | 1.00 |
| missingness doubled | 0.195 | 0.980 | 24.3 | 0.379 | 238 | 0.42 |
| context effects -50% | 0.318 | 0.979 | 21.7 | 0.498 | 256 | 0.54 |
| context effects +50% | 0.325 | 0.971 | 31.6 | 0.397 | 252 | 0.54 |
| informant accuracy halved | 0.318 | 0.976 | 24.4 | 0.465 | 255 | 0.54 |
| informant accuracy doubled | 0.334 | 0.976 | 25.2 | 0.466 | 253 | 0.54 |

## Burst schedule (secondary arm)

5-day bursts every 3 months. Sensitivity 0.170 (0.141–0.197), specificity 0.995 (0.993–0.996), false Reviews per 1,000 person-years 10.8 (9.1–12.4), median lead 262 (237–288) days, completion 0.706 (0.701–0.712).

## Failure report

- **Missed decliners** (n = 428): trajectory {'slow': 0.668, 'accelerating': 0.287, 'step': 0.044}; age {'75+': 0.369, '65-74': 0.318, '50-64': 0.269, '<50': 0.044}; familiarity {'low': 0.458, 'medium': 0.36, 'high': 0.182}; memory-led 73%; mean completion 36%; dropped out 76%.
- **Detected decliners (for comparison)** (n = 207): trajectory {'slow': 0.483, 'accelerating': 0.353, 'step': 0.164}; age {'65-74': 0.372, '75+': 0.304, '50-64': 0.275, '<50': 0.048}; familiarity {'medium': 0.401, 'low': 0.362, 'high': 0.237}; memory-led 62%; mean completion 60%; dropped out 29%.
- **False Reviews** (n = 379): trajectory {'stable': 0.43, 'ageing_drift': 0.343, 'transient': 0.195, 'slow': 0.013, 'accelerating': 0.013, 'step': 0.005}; age {'50-64': 0.393, '65-74': 0.274, '<50': 0.216, '75+': 0.116}; familiarity {'medium': 0.383, 'high': 0.346, 'low': 0.272}; memory-led 70%; mean completion 65%; dropped out 25%.

## Limits

- Simulated cohort; parameters marked "assumption" in `lab/src/baseline_lab/params.yaml` are not from local data.
- Review is treated as final (first Review only); real clinician review would release false Reviews and allow later detection.
- The pathway comparison is a model. Usual care is timed from true change onset, which favors usual care.
- Item parameters are invented; DIF results show the check works, not that the app's items are fair.
- Thresholds were tuned on this generator. A local pilot (roadmap) must re-estimate them before any real use.
