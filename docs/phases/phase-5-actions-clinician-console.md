# Phase 5 — Actions, Prevention Plan and Clinician Console

**Priority:** P1 (minimal console is P0) · **Requirements:** 4, 5 (feeds 6) · **Depends on:** Phases 2 and 4

## Goal
Turn every state into a clear, safe, personal next step, and give clinicians an efficient review loop whose outcomes feed the Validation Lab.

## 5.1 User-facing results
- **Weekly story:** plain language, no raw scores. For example: "Your new-place memory was steady. Sleep dipped on Tuesday and Wednesday."
- **State cards** with approved templates:
  - Stable: "No meaningful change in what we measure. This is not a full check-up."
  - Watch: what changed, the likely context, what to do, when the retest is.
  - Review: calm, not a diagnosis, why a doctor's view helps, sharing options.
  - Urgent: scripted guidance, emergency number (998 ambulance in UAE), no model output.
- **Uncertainty shown** as a simple range band, explained in words.

## 5.2 Prevention plan (FINGER/POINTER-style)
Personalized from risk context: physical activity, blood pressure and glucose follow-up, sleep routine, hearing and vision checks, social connection, cognitive engagement, diet (culturally adapted, Ramadan-aware). Small weekly goals. Never gated by genomics.

## 5.3 Routing
| Trigger | Route |
|---|---|
| Hearing or vision issue reported | Audiology or optometry |
| Low mood, loneliness, stress persisting | Mental health or primary care |
| Uncontrolled BP or glucose | Primary care |
| Review state | Primary care first, with packet; clinician decides on neurology or geriatrics |
| Urgent | Emergency care |

## 5.4 Referral packet (drafted by engine; Noor only formats)
Baseline and trajectory with uncertainty; rule fired and drivers; confounders checked; informant summary; risk context; device readings with quality flags; genomics (if consented) with counseling prompt; threshold version; "screening, not diagnosis" statement. Shared only with the user's explicit choice.

## 5.5 Clinician console
- **P0 minimal:** review queue sorted by urgency and time waiting; patient view with trajectory, explanation, confounders; accept, override (with reason) or refer onward; outcome entry.
- **P1:** time-in-queue tracking, notes, audit log of all agent messages, threshold-version display.
- **Outcomes** (for example "assessment found MCI," "reversible cause: B12," "no impairment") flow to the Lab as labels; overrides are tracked as a quality metric.

## Deliverables
- [ ] Weekly story and state cards with templates
- [ ] Prevention plan generator (rule-based)
- [ ] Routing rules
- [ ] Referral packet view and export
- [ ] Clinician console (P0 minimal, then P1)
- [ ] Outcome capture → Lab

## Acceptance criteria
- A clinician unfamiliar with the project understands a Review case in under 2 minutes (test with a mentor).
- No user-facing text uses banned words.
- Flag-to-review time is recorded for every Review case.
