# Phase 1 — Measurement Core: Scenario Task Engine and Check-in

**Priority:** P0 · **Requirement:** 1 (also feeds 2 and 6) · **Depends on:** Phase 0

## Goal
A brief, accessible, culturally fitting set of everyday tasks that produce clean, comparable measurements on every repeat.

## Scenario families

| Family | Everyday scene | Construct | Key metrics | Priority |
|---|---|---|---|---|
| Family-gathering shopping | Remember a list for a family gathering, then pick items at a souk or supermarket; delayed recall later in the session | Associative memory, delayed recall | Items correct, intrusions, delayed recall, time | P0 |
| Medication and bills | Sort a weekly pill organizer from a prescription; pay a utility bill with correct amount and date | Executive function, everyday management | Errors, steps, time, plan efficiency | P0 |
| Quick response | Tap when the coffee cup (or another local object) appears; choose the matching item | Processing speed, attention | Median reaction time, variability (IIV), accuracy | P0 |
| Errands and way-finding | Plan a route through a simple neighborhood map; remember to do something at a set point | Navigation, prospective memory | Route efficiency, prospective-memory hit | P1 |
| Voice message | Describe a picture or leave a message for family | Speech and language | Duration, pauses, word count (supporting signal only) | P2 |

## Design rules
- **Parallel forms:** each scene is a template; items (lists, prices, maps) are drawn from a calibrated pool so each repeat is different but equal in difficulty.
- **Practice round first,** not scored.
- **Fixed host script during scored tasks:** no hints, no varied praise, same wording every time. Friendly talk only before and after.
- **Accessibility:** audio instructions in Arabic and English, large targets, no time pressure except the quick-response task, tap and voice input, family-assisted mode (flagged as assisted in the data).
- **Sensory pre-check:** "Can you hear this clearly? Can you read this?" with volume and text-size adjustment, stored as a covariate.
- **Digital familiarity:** 3 questions at onboarding, stored as a covariate.
- **Cultural content:** local foods, places, currency (AED), names, Hijri and Gregorian dates. Co-design with at least 3 Emirati or Arabic-speaking reviewers.
- **Session length:** 3–4 minutes per scenario. Works offline; syncs later.
- **Raw data captured:** every tap, timestamp, response, device type, screen size, input mode, assisted flag.

## Context check-in (about 20 seconds)
Sleep last night (hours, quality), mood, stress, pain or illness today, hearing and vision today, loneliness (single item), fasting or Ramadan, new medication, caffeine. Tap-based with icons; Noor can ask it conversationally in Phase 6.

## Deliverables
- [ ] Three P0 scenario families playable on a phone, in Arabic and English
- [ ] Item pools with at least 10 parallel forms per P0 family
- [ ] Check-in screen
- [ ] Onboarding: language, consent (granular), digital familiarity, sensory check
- [ ] Raw event logging and offline storage with sync
- [ ] Scoring functions that turn raw events into the key metrics in the table above

## Acceptance criteria
- An older adult with no help can finish onboarding plus one scenario in under 8 minutes (tested on 3 people).
- Arabic layout is fully right-to-left with no mixed-direction bugs.
- Any two parallel forms produce similar mean scores in the pilot (difference within a pre-set margin, checked in Phase 7).
- Every task works with tap only (no voice required).

## Out of scope
Change detection, agent, clinician console.
