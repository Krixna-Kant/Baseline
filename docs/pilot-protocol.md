# Pilot Protocol (roadmap, not run)

**Status:** Stage 1 and Stage 2 are written for the roadmap slide. Decision Q3 said no human pilot in the hackathon build; Stage 0 below is a **proposal to revisit Q3** (see `docs/03-decisions-log.md`), and the tooling for it is built. Nothing here has been run, and no real participant data exists in this repo.

## Stage 0: team-and-family pilot week (proposed, 7 days)

**Why.** The Lab's biggest uncertainties are assumptions, not code: how often people actually complete sessions (the Lab assumes 0.54 over a year), how noisy each task is for each person (the engine's prior SDs, and the generator's extra noise for low familiarity and low education, which drives the education gap), and how much people improve with practice. A week with real people replaces the first numbers with measurements.

| Item | Plan |
|---|---|
| Participants | 10–15 adults from the team's own families and friends, each consenting for themselves; aim for at least 4 aged 60+, at least 4 Arabic-first, and at least 3 with low phone familiarity or school education only |
| Exclusions | Under 18; anyone who cannot consent for themselves; anyone with a known neurological diagnosis |
| Consent | The Stage 1 short consent. In the app, research use must be switched on before the export button appears |
| Schedule | Onboarding on day 1, then the baseline schedule for 7 days (one or two sessions a day); no reminders beyond the app's own |
| Data | The app's "Pilot week" export on the Privacy page: age/education/familiarity bands, a fresh random code, sessions without raw taps, dates shifted to January 2000. No names, birth year, or profile id. Files go to one team member and are deleted after analysis |
| Analysis | `python -m baseline_lab.pilot <folder>` gives completion over the week, within-person SD per task family against the engine's priors, practice gain, odd-versus-even session agreement (ICC), and session length, split by language, education, familiarity and age band (descriptive only) |
| Decision rules | If within-person SD differs from the engine prior by more than 30%, update the prior and re-run the Lab before quoting any Lab number. If completion over the week is below 70%, treat the Lab's 0.54 a year as optimistic and re-run the Lab with the measured rate. If the extra noise for low familiarity is under 1.2× or over 1.6×, update the generator and re-run the fairness analysis |

**What a week cannot tell us:** long-run adherence (it fades over months [B14]), six-month retest reliability, or any accuracy figure. Present results as "measured on n people over one week".

## Purpose

Check, on real people, the things the simulation can only assume: whether the tasks are usable, whether repeated results agree, and whether Arabic and English versions behave the same. The pilot **cannot** measure sensitivity, specificity or clinical accuracy, and the slide must say so.

## Stage 1: feasibility (hackathon follow-up, about 4 weeks)

| Item | Plan |
|---|---|
| Participants | 15–30 consenting adults (team, friends, family), aiming for at least a third Arabic-first speakers and a third aged 50+ |
| Exclusions | Under 18; anyone unable to give their own consent; known neurological diagnosis (to keep this a usability study) |
| Consent | Short written consent in Arabic and English: purpose, what is collected, that it is not a health check, the right to stop and delete at any time; data deleted after the study unless the person opts in |
| Data | App data only (task metrics, check-in answers); no names in the dataset, a random participant code; no device or record imports |
| Protocol | Onboarding; two full sessions 1–7 days apart (each P0 task family, using parallel forms); System Usability Scale; five short feedback questions; optional voice-input round |
| Measures | Completion and time per task; test-retest ICC(2,1) per family and composite, with Bland-Altman limits; parallel-form difference; SUS score; Arabic speech-recognition error rate if voice is used; splits by language, age band and phone familiarity where numbers allow |
| Analysis | Same code as the Lab (`lab/src/baseline_lab/metrics.py`), so pilot and simulation results sit side by side in the Lab's pilot panel |
| Success | Median session under 8 minutes; SUS ≥ 68; composite ICC ≥ 0.75 (the Lab criterion); no task family with completion under 80% |

## Stage 2: local validation (with a partner, 12–18 months)

| Item | Plan |
|---|---|
| Partners | DoH Abu Dhabi, the UAE Healthy Future Study, or a hospital memory clinic |
| Ethics | Institutional review board approval; UAE-hosted data; ADHICS-aligned security review [G1, G2] |
| Design | Prospective cohort aged 50+, recruited in primary care, with a memory-clinic subgroup; Baseline schedule as in the Lab's daily arm; clinician assessment for everyone at 12 months and for anyone reaching Review |
| Outcomes | Sensitivity and specificity against clinician assessment; false referrals per 1,000 person-years; time from Review to assessment; fairness by language, age, education and phone familiarity; item bias on real responses |
| Threshold update | Re-run the pre-registered selection rule on pilot data; publish the result as threshold v2 with the same report format |

## What changes in the app for a pilot

- Sign-in and UAE hosting instead of on-device only storage.
- Research-use consent switch becomes required for enrolment (it already exists and is off by default).
- The clinician console reads real shared summaries, with sign-in and an audit trail.
- Noor's optional LLM rephrase stays off unless the ethics approval covers it.
