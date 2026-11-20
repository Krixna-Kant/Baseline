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
- [ ] Intake flow
- [ ] Informant invite and questionnaire
- [ ] Device Hub: simulated feed and manual entry (P1); file import and Web Bluetooth (P2)
- [ ] Synthetic Weqaya or Malaffi bundle for Khalid
- [ ] Risk context views for user and clinician

## Acceptance criteria
- Every reading shows its source and whether it is simulated.
- Turning off a consent scope hides that data everywhere immediately.
- Changing risk factors does not change the cognitive state (tested).
