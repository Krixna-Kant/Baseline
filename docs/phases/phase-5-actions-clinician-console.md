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
- [x] Weekly story and state cards with templates
- [x] Prevention plan generator (rule-based)
- [x] Routing rules
- [x] Referral packet view and export
- [x] Clinician console (P0 minimal; P1 time-in-queue and threshold version done, audit log of agent messages waits for Phase 6)
- [x] Outcome capture → Lab (exported as a labels file)

## Implementation notes
- **One decision, many screens:** `useEvaluation()` (`web/src/lib/useEvaluation.ts`) sends sessions, consented informant reports and the latest clinician decision time to `POST /evaluate`, cached per history. Home, plan, packet and console all show the same decision.
- **Home:** state card with template text, a range bar (estimate and 95% range against the person's usual), the weekly story (per activity: steady, a little different, better; context days by weekday), and "where to go".
- **Plan (`web/src/lib/plan.ts`):** goals for BP, glucose, hearing, vision, mood, smoking, activity, sleep, social, diet and mental engagement, each with the reason it was suggested. Ramadan wording when fasting appears in recent check-ins. The first three are "this week"; each can be ticked off per week. Genomics is never an input.
- **Routing:** Urgent → emergency only; Review → primary care with packet; BP ≥140/90 twice in 30 days or high glucose/HbA1c in 90 days → primary care; low mood, stress or loneliness on 3 of the last 7 check-ins → mental health; hearing or vision → audiology or optometry.
- **Packet (`web/src/lib/packet.ts`):** person, decision with rule and plain-language reason, family intervals, trajectory chart with 95% band and state colours, context checked, informant, health context with sources, latest readings with quality and synthetic flags, genomics (clinician view only), threshold and engine versions, screening statement. Shared only after the `share_clinician` consent; print to PDF and JSON download.
- **Console (`/[lang]/clinic`):** queue sorted by urgency then waiting time; case view uses the same packet with genomics shown; accept, override (reason required) or refer onward (service list); outcome entry closes the case. Metrics: open cases, median flag-to-review time, overrides, outcomes. "Export outcome labels" writes the file the Lab would ingest. A decision sets `reviewedAt`, which releases Review and re-anchors the baseline in the engine.
- **Demo limit:** the console reads summaries shared on the same device; a real deployment needs a clinic backend and sign-in.

## Acceptance criteria
- A clinician unfamiliar with the project understands a Review case in under 2 minutes (test with a mentor).
- No user-facing text uses banned words.
- Flag-to-review time is recorded for every Review case.
