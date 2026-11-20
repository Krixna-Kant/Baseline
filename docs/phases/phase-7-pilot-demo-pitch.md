# Phase 7 — Mini-pilot, Demo and Pitch

**Priority:** P0 · **Requirement:** 6 (and the whole story) · **Depends on:** Phases 1–3 at minimum

## Goal
Add a small real-world data point, rehearse a reliable demo, and pitch the validation story honestly.

> **Decision Q3:** no human pilot in the hackathon build. Validation is simulation-only. Section 7.1 stays as a **written pilot protocol** shown on the roadmap slide ("what we would run next"). Remove the pilot panel from the Lab and the pilot rows from the deliverables. Test-retest and parallel-form results come from the simulation and are labeled as such.

## 7.1 Mini-pilot protocol (roadmap only, not run)
- **Participants:** about 15–30 consenting adults (team, friends, family), aiming for some Arabic speakers and some aged 50+.
- **Consent:** short written consent; no health data beyond what the app needs; data deleted after the hackathon unless people opt in.
- **Protocol:** onboarding, two sessions of each P0 family 1–7 days apart, check-in, System Usability Scale, short feedback questions.
- **Measures:** completion, time per task, test-retest ICC, parallel-form difference, usability score, Arabic speech-recognition error rate (if voice used), segment splits where numbers allow.
- **Cannot measure:** sensitivity, specificity or clinical accuracy. Say so on the slide.

## 7.2 Demo script (about 4 minutes)
1. **Problem (30 s):** gradual change, misleading one-off scores, 24-month median delay locally.
2. **Instrument (75 s):** Khalid onboards with Noor in Arabic; one everyday scenario; check-in; Device Hub with simulated BP.
3. **Time-lapse (45 s):** baseline set → week 6 sleep dip (Watch, context-explained) → Ramadan (no flag) → month 5 persistent change plus Mariam's report → Review → clinician console accepts and refers.
4. **Validation Lab (75 s, the hero):** threshold slider, one-stage vs two-stage false referrals per 1,000, fairness by language, age and education, pilot reliability next to simulation, failure cases.
5. **Honesty and roadmap (15 s):** what is simulated, local validation with DoH, UAEHFS or hospital partners, UAE-hosted and ADHICS-aligned.

**Backup:** screen-recorded video of the whole demo; seeded data that does not need internet.

## 7.3 Pitch deck outline
1. Problem and local benchmark
2. Our answer in one line
3. How it works (one diagram)
4. Fair, Fingerprint, Context
5. Safety: engine decides, LLM explains
6. **Validation results** (two slides)
7. What is real, simulated, roadmap
8. Team and ask

## 7.4 Judge Q&A prep
- "Isn't your simulation circular?" → different generator, sensitivity analysis, failure report.
- "How do you know it works for Emiratis?" → we don't yet; here is the pilot plan and partners; ipsative scoring reduces norm dependence.
- "What about false positives and anxiety?" → two-stage gate, numbers per 1,000, gentle templates.
- "Why an AI agent?" → accessibility; it never decides; red-team results.
- "Data privacy?" → granular consent, UAE hosting roadmap, synthetic demo.

## Deliverables
- [ ] Pilot data and pilot panel in the Lab
- [ ] Demo script rehearsed 3 times under 4 minutes
- [ ] Backup video
- [ ] Pitch deck
- [ ] Final validation report v1 attached to submission

## Acceptance criteria
- Demo runs end to end offline.
- Every number on the slides traces to the evidence register or the Lab report.
