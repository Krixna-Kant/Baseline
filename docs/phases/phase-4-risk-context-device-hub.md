# Phase 4 — Risk Context, Informant Module and Device Hub

**Priority:** P1 · **Requirement:** 3 · **Depends on:** Phase 0 data contracts; Phase 2 for informant use in states

## Goal
Bring physical, metabolic, sleep, mental-wellbeing, lifestyle, family-history and genomic context into one consented view, without letting risk factors change the cognitive state.

**Key rule:** risk context changes the *prevention advice and the clinician packet*. It does **not** change Stable, Watch or Review. (Informant reports of functional change are the exception; they are part of the Review rule.)

## 4.1 Intake
- Lancet 2024 factors: education, hearing, LDL cholesterol, depression, head injury, physical inactivity, diabetes, smoking, hypertension, obesity, alcohol, social isolation, air pollution, vision.
- Family history of dementia (with relation and age of onset).
- Short and conversational (Noor can run it in Phase 6). "Don't know" is always allowed.

## 4.2 Informant module
- Invite a family member, friend or caregiver by link. Record relationship and language.
- Short questionnaire, "AD8-style, pending permission" until licensing is confirmed; IQCODE-style as P2.
- Monthly repeat; change in informant report feeds the Review rule.
- The person controls what the informant sees.

## 4.3 Device Hub (demo)

| Path | What | Priority |
|---|---|---|
| Simulated device feed | Control panel streaming BP, glucose, sleep duration, steps; "Simulated" badge | P1 |
| Voice or manual entry | "My pressure was 132 over 84" → confirmed record | P1 |
| File import | CSV or FHIR-style bundle standing in for Weqaya or Malaffi summaries (synthetic) | P2 |
| Live Web Bluetooth | Standard BLE BP cuff or glucometer on Android Chrome | P2 |

**Reading record:** value, unit, source, device model, timestamp, measurement context (for example after exercise), quality flag, consent scope, is_synthetic.

**Sleep handling:** store duration and regularity only, with an uncertainty note; ignore sleep stages.

## 4.4 Genomics (optional, off by default)
- Separate explicit consent.
- Synthetic APOE input only in the demo.
- **Never shown raw to the user.** Appears in the clinician packet with a genetic-counseling prompt.
- Never gates prevention advice (POINTER benefit held regardless of APOE4).

## 4.5 Risk context view
- For the user: plain-language list of modifiable factors with "what you can do," no risk scores.
- For the clinician: full picture with sources and dates.

## Deliverables
- [x] Intake flow
- [x] Informant invite and questionnaire
- [x] Device Hub: simulated feed and manual entry (P1); file import and Web Bluetooth (P2) cut
- [x] Synthetic Weqaya or Malaffi bundle for Khalid
- [x] Risk context views for user and clinician

## Implementation notes
- **Screens:** `/[lang]/health` (intake plus "what you can do"), `/[lang]/family` and `/[lang]/family/answer` (informant), `/[lang]/devices` (Device Hub), `/[lang]/privacy` (consent toggles).
- **Store:** `risk`, `informant`, `readings` added to the local state. `visibleData()` in `web/src/lib/store.ts` is the single filter for consent: informant, device readings, imported answers and genomics disappear everywhere as soon as their scope is off, and come back if it is turned on again. Nothing is deleted until the user deletes all data.
- **Informant:** 8 original AD8-style items (yes, no, don't know), cut-off 2 sets `newDifficulty`, which the engine uses for the decline-plus-informant rule. In this local-first MVP the invite link opens the form on the same device; a real multi-device invite needs a backend.
- **Device Hub:** simulated cuff, glucometer and wearable each add a week of synthetic readings with source, model, context, quality flag and `isSynthetic`. Typed or spoken entry ("132 over 84", "ضغطي ١٣٢ على ٨٤", "sugar 110 fasting") is parsed, then confirmed before saving; speech recognition is used where the browser has it. Sleep keeps duration only, with an uncertainty note.
- **Records:** "Load sample summary" imports a synthetic Weqaya screening (BP, HbA1c, weight; hypertension, diabetes, high LDL, obesity) under the `records_import` scope.
- **Genomics:** synthetic APOE choice behind the genomics consent; never shown to the user, appears only in the clinician view with a counselling prompt; the plan never reads it.
- **Isolation test:** `engine/tests/test_api.py::test_risk_context_never_changes_the_cognitive_state` sends risk factors, readings and genomics alongside the same sessions and checks the decision and trajectory are identical.

## Acceptance criteria
- Every reading shows its source and whether it is simulated.
- Turning off a consent scope hides that data everywhere immediately.
- Changing risk factors does not change the cognitive state (tested).
