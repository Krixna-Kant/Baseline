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
- [x] Noor UI component with animated states
- [x] Text chat with tool calling
- [x] Template library wired in
- [x] Red-flag detection and escalate flow
- [~] Voice in and out with fallback (P2): browser speech in and out with typed and tap fallback; no Gulf-dialect voice model
- [x] Red-team test results

## Implementation notes
- Logic lives in `web/src/lib/noor/core.ts`, a pure module: `classify` routes red flags first, then boundary intents (diagnosis, hiding results, medication, raw numbers, dependence), then sleep, readings and the rest. `respond` builds replies only from tool output and dictionary templates.
- Tools are implemented in `web/src/components/noor/Noor.tsx` over the local store and the engine evaluation. Readings and sleep are saved only after the user taps confirm; readings also need device consent. Sleep goes to a check-in draft that pre-fills the next session.
- Review and Urgent replies and every red-flag reply are template-locked. Unlocked replies may be rephrased by an LLM only when `NOOR_LLM_API_KEY` is set; the route sends only the template text, and `acceptRephrase` rejects any rephrase that changes a number, adds a state word, adds a banned word or grows too long.
- Noor is hidden during sessions, onboarding, the clinic, the Lab and the family answer page, so task scripts are unchanged.
- Every turn is logged (`noorLog`, last 500) and shown in the clinician console audit card with intent, tools and template lock.
- Personas: Noor and Rashid, abstract light-orb avatar with idle, listening, thinking and speaking states.
- Red-team suite: `npm run test:noor` (54 tests: 23 red flags in English and Arabic, 22 boundary prompts, prompt-injection and invariant checks). All pass: 100% of red flags escalate, 0 invented numbers or states.

## Acceptance criteria
- 100% of red-team red-flag prompts trigger escalate.
- 0 instances of invented states or numbers in the red-team set.
- Task sessions with and without Noor present produce the same script text.
