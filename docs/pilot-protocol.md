# Pilot Protocol (roadmap, not run)

**Status:** written for the roadmap slide. Decision Q3: no human pilot in the hackathon build. Nothing here has been run, and no real participant data exists in this repo.

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
