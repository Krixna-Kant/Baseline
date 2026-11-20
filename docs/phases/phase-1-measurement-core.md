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
- [x] Three P0 scenario families playable on a phone, in Arabic and English
- [x] Item pools with at least 10 parallel forms per P0 family (seeded draws; see notes)
- [x] Check-in screen
- [x] Onboarding: language, consent (granular), digital familiarity, sensory check
- [x] Raw event logging and offline storage (sync to the engine arrives with Phase 2)
- [x] Scoring functions that turn raw events into the key metrics in the table above

## Implementation notes (MVP build)
- **Where things live:** `web/src/components/onboarding`, `web/src/components/session`, `web/src/components/tasks`, `web/src/lib/{store,forms,content,types}.ts`.
- **Session flow:** check-in → (urgent screen if red flag) → shopping (immediate) → quick response → pill organizer → shopping (delayed) → done. A practice round runs only the first time a person meets each family. The step plan is fixed when a session starts.
- **Parallel forms:** every session draws a new seeded form: 6 targets plus 6 foils from 30 items, 4 pill rows from 6 medicines and 7 instructions, and fresh reaction-time foreperiods and stimulus order. Equal difficulty is assumed, not calibrated. That is acceptable for a simulation-only build; the pilot protocol checks it.
- **Medication and bills:** only the pill organizer is built. Bill payment is deferred.
- **Metrics per task** (stored in `TaskResult.metrics`):
  - shopping: hits, false alarms, hit rate, false-alarm rate, discrimination, recall time;
  - quick: simple and choice median reaction time, coefficient of variation, choice accuracy, anticipations, lapses;
  - medication: cell accuracy, omissions, commissions, perfect rows, changes, time.
- **Storage:** `localStorage` key `baseline:v1`. Partial sessions are saved with `completed: false` when the person stops early or a red flag fires.
- **Tested** end to end in the browser: onboarding, a first session with practice rounds, and a second session without them. Not yet tested with real older adults (no human pilot in this build).

## Acceptance criteria
- An older adult with no help can finish onboarding plus one scenario in under 8 minutes (tested on 3 people).
- Arabic layout is fully right-to-left with no mixed-direction bugs.
- Any two parallel forms produce similar mean scores in the pilot (difference within a pre-set margin, checked in Phase 7).
- Every task works with tap only (no voice required).

## Out of scope
Change detection, agent, clinician console.
