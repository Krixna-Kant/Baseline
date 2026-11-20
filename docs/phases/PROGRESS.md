# Progress Tracker

Update this file as work lands. Status: `Not started` · `In progress` · `Done` · `Cut`.

| Phase | Status | Owner | Notes |
|---|---|---|---|
| 0 Foundations and scope lock | Done | | Licensing check and Arabic copy review carried forward (not blocking) |
| 1 Measurement core | Done | | Shopping, quick response, pill organizer; bill payment deferred; UI restyle pending reference |
| 2 Change engine | Done | | Stateless `POST /evaluate`; 20 tests pass; v0 too loose by design, v1 from Lab |
| 3 Validation Lab (hero) | In progress | | Pipeline, report and Lab UI built; full 20,000-user run finishing |
| 4 Risk context and Device Hub | Done | | Intake, informant (AD8-style), simulated devices, voice/typed entry, synthetic Weqaya import, consent toggles; Web Bluetooth and FHIR import cut (P2) |
| 5 Actions and clinician console | Done | | Weekly story, range band, plan, routing, packet (print/JSON), console with decisions, outcomes, flag-to-review time |
| 6 Noor agent | Not started | | |
| 7 Pilot, demo, pitch | Not started | | Start pilot recruitment early |

## Critical path
Phase 0 → Phase 1 metrics → Phases 2 and 3 together → minimal console (Phase 5) → Phase 7.
Phases 4 and 6 can be built by a second person alongside, once Phase 0 contracts exist.

## Key checkpoints
- [x] Validation protocol committed before any simulation results
- [x] P0 evidence verified
- [x] PWA shell, locale routing and design system build and pass lint
- [x] Three P0 scenarios playable in Arabic and English
- [x] Engine passes the seven hand-made scenarios
- [ ] Lab produces metrics by segment from one command
- [ ] Threshold v1 chosen by pre-registered rule
- [x] Minimal clinician console working
- [ ] Pilot protocol written (roadmap only; no human pilot in the hackathon build)
- [ ] Demo rehearsed and backup video recorded
