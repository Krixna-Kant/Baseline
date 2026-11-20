# Demo Script (about 4 minutes)

Everything shown is synthetic. Numbers come from `docs/validation-report.md` (protocol run, seed 20261120) or `docs/02-evidence-register.md`.

## Setup (before going on stage)

1. Start the engine from the repo root: `.\.venv\Scripts\python -m uvicorn baseline_engine.api:app --port 8000`.
2. Start the app from a production build: `cd web; npm run build; npm run start` (port 3000). No internet is needed after the build.
3. Check the story still lands on the scripted states: `cd web; npm run test:demo` (3 tests pass).
4. Open two tabs: `/ar` (phone width, the presenter's "Khalid" screen) and `/en/lab`.
5. On `/ar/demo`, press **Clear the demo data** so onboarding starts fresh.
6. Voice off by default; the room is noisy. Typed input to Noor is the reliable path.

## 1. Problem (30 s)

> "In Abu Dhabi, the median time from first symptoms to a dementia diagnosis is two years, and it is longest when the first sign is forgetfulness [A1]. One-off tests miss gradual change and mislabel people who simply had a bad night. Baseline watches the change, not the score."

## 2. The instrument (75 s), tab `/ar`

1. Onboarding in Arabic: about you, phone familiarity, hearing and seeing, consent choices (point at the separate toggles for family, devices, records, clinician sharing).
2. Start one session: quick check-in, then the shopping-list task. Leave the session after the list; the full session is not needed for the story.
3. Open Noor: type `ضغطي ١٥٠ على ٩٥`. Noor repeats the reading and asks to confirm. Tap **نعم، احفظها**.
4. Say: "Noor is an AI assistant, not a doctor. She can only read what the engine decided, and urgent messages come from fixed templates." Type `عنده ضعف مفاجئ في جهة واحدة` to show the 998 escalation.

## 3. Time-lapse: Khalid's five months (45 s), `/ar/demo`

Press each moment in order; each opens the screen that matters.

| Moment | What the audience sees | Line |
|---|---|---|
| 1 · Day 30 | Home: baseline set, Stable | "From now on Khalid is compared only with himself." |
| 2 · Day 46 | Home: Watch, "shorter or poorer sleep often affects…" | "A bad week of sleep. Baseline says why and does not raise an alarm." |
| 3 · Day 106 | Plan: Ramadan-friendly goals; nothing raised | "A month of fasting and late nights: expected, so no flag." |
| 4 · Day 145 | Family check-in | "A change that stays, with good sleep. Baseline asks for extra sessions and suggests asking family." |
| 5 · Day 152 | Summary for my doctor: Review, rule `decline_plus_informant`, Mariam 4/8 | "His daughter noticed too. Only now does Baseline suggest a doctor." |
| 6 · Day 152 | Clinician console: case in queue | Accept, refer to memory clinic, record the outcome. "Every decision and override is logged." |

The engine makes every one of those decisions live; the demo page only writes the history. `npm run test:demo` checks this.

## 4. Validation Lab (75 s, the hero), tab `/en/lab`

1. **Criteria card:** 4 of 6 pre-stated criteria met; fairness and item bias **not met**, shown in red. "We wrote these targets down before running anything."
2. **Threshold explorer:** move the Watch threshold; show false referrals per 1,000 person-years against sensitivity. Switch gate one-stage vs two-stage: **58.7 vs 25.3** false referrals per 1,000 person-years for a median **12 days** extra delay.
3. **Fairness by group:** language gap 0.01; education gap 0.12 and familiarity gap 0.11, over the 0.10 limit. "Same threshold for everyone; we show where it is not fair yet."
4. **Reliability:** composite ICC **0.88** (baseline halves) and **0.94** (consecutive blocks).
5. **Time to assessment (model):** median **23.5 → 13.1 months**; assessed within 12 months **22% → 45%**. "A model using the Al Ain delay study, not observed outcomes."
6. **Where it fails:** missed people are mostly slow changers with low completion. Sensitivity is **0.33** at this threshold and rises to **0.60** if people complete their sessions.

## 5. Honesty and roadmap (15 s)

> "Everything you saw is simulated. Next: a local pilot with DoH, the UAE Healthy Future Study or a hospital partner to re-estimate thresholds on real people, UAE hosting, and ADHICS alignment."

## Backup

- If the engine is down: the Lab still works (static results), the demo page shows an engine message for the clinic moment only. Restart the engine and press the moment again.
- If the browser misbehaves: play the backup screen recording (record it after the first full rehearsal; store it next to the deck, not in the repo).

## Rehearsal log

| # | Date | Time | Notes |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
