# 03 — Decisions Log

## Confirmed decisions

| # | Decision | Reason |
|---|---|---|
| D1 | Build a PWA (Next.js), wrap with Capacitor later | One codebase, installs from a link, offline tasks, records cleanly for the demo |
| D2 | Personality is opt-in coaching personalization only, never a risk label | Small effects, no consistent link to pathology |
| D3 | Everyday-life scenario task engine instead of named games | Ecological validity, cultural fit, parallel forms |
| D4 | Three-tier data approach: public numbers calibrate the simulation, consent-based data plug, Baseline creates the missing local reference | No public Emirati longitudinal cognitive data exists |
| D5 | Device Hub with four input paths: simulated feed, voice or manual entry, file import, live Web Bluetooth on Android | PWA cannot read HealthKit or Health Connect |
| D6 | "The engine decides, the LLM explains" is a hard architecture rule | LLM medical-advice safety evidence |
| D7 | Companion agent with selectable persona; Noor is the default demo character | Persona gender has small effect; choice respects preference |
| D8 | Requirement 6 (validation) is the hackathon focus | Team decision |

## Review decisions (all approved on 2026-11-20, as recommended defaults; revisit any time)

| # | Proposal | Why |
|---|---|---|
| N1 | Validation Lab is the hero screen of the demo | Matches chosen focus |
| N2 | Ipsative-first scoring; population norms only as a secondary labeled reference | No local norms; reduces cultural and education bias |
| N3 | Two-stage referral gate (flag → retest burst + informant → Review) | Cuts false-referral burden |
| N4 | Simulation uses a richer generator than the detector, plus sensitivity analysis | Avoids circular validation |
| N5 | Report three time metrics separately; never claim to beat the 34.7-month figure directly | Benchmark is not like-for-like |
| N6 | APOE result is never shown raw to the user; clinician packet with genetic-counseling prompt | Genetic disclosure safety |
| N7 | Ramadan and prayer-time aware scheduling and covariates | Cultural validity |
| N8 | Pre-register the validation protocol before running the simulation | Credibility |
| N9 | MVP cut: P0 = 3 task families, check-in, engine, Lab, minimal console, Noor in text | Hackathon scope |
| N10 | Agent cannot downgrade a Review or Urgent state, and cannot answer diagnostic questions | Safety |

## Answered

| # | Question | Answer |
|---|---|---|
| Q1 | Timeline | Focus on the MVP (P0) first; time is available to extend into P1 after |
| Q2 | Team | Two builders: the user and the AI assistant |
| Q3 | Pilot | No human pilot for now. Validation is simulation-only. The pilot protocol is kept as a written roadmap item. |
| Q4 | Proposals N1–N10 | All approved as recommended defaults |

## Open questions (not blocking P0)

1. Which LLM and speech provider can we use, and do we have API credits? (Needed by Phase 6.)
2. Do we have a mentor or clinician who can review the Review and Urgent message templates?
3. Is there a standard BLE blood-pressure cuff or glucometer available for the live Web Bluetooth proof (P2)?
