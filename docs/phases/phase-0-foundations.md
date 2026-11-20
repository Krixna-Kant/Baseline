# Phase 0 — Foundations and Scope Lock

**Priority:** P0 · **Requirements:** all · **Depends on:** nothing

## Goal
Lock scope, write the validation protocol before building, set up the repo and design system, and confirm the evidence we will cite.

## Deliverables
- [x] Answers to the open questions in `03-decisions-log.md`; proposals N1–N10 approved
- [x] Final MVP cut (P0, P1, P2 lists) agreed
- [x] `docs/validation-protocol.md`: pre-registered and committed before any simulation
- [ ] Evidence register: every P0 claim moved to `Verified` or cut
- [ ] Repo scaffold: `web/` (Next.js PWA), `engine/` (FastAPI), `lab/` (simulation and analysis), `docs/`
- [x] Shared data contracts: `docs/data-contracts.md`
- [ ] Design system: Arabic and English, right-to-left, large type scale, high contrast, minimum 48px touch targets, audio-first instruction pattern, "Simulated" badge component
- [x] Copy guidelines: `docs/copy-guidelines.md` (templates still need clinician review)

## Tasks
1. Team kickoff: assign owners for each phase (suggested split: front end and tasks; engine and Lab; agent and console).
2. Write the validation protocol (see Phase 3 for its contents).
3. Verify the P0 evidence (A1, A3, B1–B4, B7, C3, D1, D3, E1, F9) by opening each source.
4. Check licensing for AD8, IQCODE, BADLS. Record the outcome in the decisions log.
5. Define the user segments: language (Arabic, English), age band (under 50, 50–64, 65–74, 75+), education (none or primary, secondary, tertiary), digital familiarity (low, medium, high).
6. Draft the persona and storyboard for Khalid and Mariam (used across all phases and the demo).

## Acceptance criteria
- Every team member can explain the P0 scope in one minute.
- The validation protocol exists, is committed, and has a date before any Lab results.
- No P0 claim in the pitch is still `To verify`.

## Out of scope
Any feature code.
