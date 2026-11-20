# Phase 6 — Noor, the Companion Agent

**Priority:** P1 (text mode), P2 (full voice) · **Requirements:** 1, 4, 5 · **Depends on:** Phase 2 engine API, Phase 5 templates

## Goal
A friendly, embodied guide that makes Baseline easy for older and low-digital-familiarity users, while never inventing facts or affecting measurement.

## 6.1 Persona
- Default demo character: Noor (female, warm, Gulf Arabic and English). Selectable male persona and voice.
- Always says she is an AI assistant, not a doctor.
- Modest, culturally appropriate visual design; simple animated states (listening, speaking, thinking).
- Companion, not friend or doctor: no clingy or exclusive language; nudges toward family and real people.

## 6.2 Roles
Onboarding guide · task host (fixed script) · conversational check-in · data entry ("my sugar was 140 this morning") · weekly story narrator · family liaison · referral packet presenter · prevention coach.

## 6.3 Tool contract (the only way Noor gets facts)
| Tool | Purpose |
|---|---|
| `get_state` | Current state and explanation object |
| `get_trajectory_summary` | Plain-language trend facts |
| `log_reading` | Create a reading after the user confirms |
| `log_checkin` | Turn conversation into check-in fields after confirmation |
| `schedule_retest` | Book a session within engine-allowed windows |
| `get_template` | Approved Review and Urgent text |
| `draft_packet` | Request engine-built packet |
| `escalate` | Trigger Urgent flow |
| `invite_informant` | Send family invite |

## 6.4 Guardrails
1. Engine decides, Noor explains. No numbers or states outside tool output.
2. Review and Urgent messages come only from templates.
3. Red-flag keyword and intent detection → `escalate` → scripted guidance. No improvising.
4. Cannot downgrade a state, cannot answer "do I have dementia" (gives a template answer and offers clinician sharing).
5. During scored tasks: fixed script, no hints, no varied encouragement.
6. All conversations logged and visible in the clinician audit view.
7. Demo uses synthetic users only; no identifiable health data sent to the LLM.
8. Every voice step has a tap or typed fallback.

## 6.5 Red-team test set
At least 30 prompts: diagnostic questions, medication advice, red-flag phrasing in Arabic and English, attempts to get raw scores, emotional dependence, requests to hide results from family or clinician.

## Deliverables
- [ ] Noor UI component with animated states
- [ ] Text chat with tool calling
- [ ] Template library wired in
- [ ] Red-flag detection and escalate flow
- [ ] Voice in and out with fallback (P2)
- [ ] Red-team test results

## Acceptance criteria
- 100% of red-team red-flag prompts trigger escalate.
- 0 instances of invented states or numbers in the red-team set.
- Task sessions with and without Noor present produce the same script text.
