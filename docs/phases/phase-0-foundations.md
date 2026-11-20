# Phase 0 — Foundations and Scope Lock

**Priority:** P0 · **Requirements:** all · **Depends on:** nothing

## Goal
Lock scope, write the validation protocol before building, set up the repo and design system, and confirm the evidence we will cite.

## Deliverables
- [x] Answers to the open questions in `03-decisions-log.md`; proposals N1–N10 approved
- [x] Final MVP cut (P0, P1, P2 lists) agreed
- [x] `docs/validation-protocol.md`: pre-registered and committed before any simulation
- [x] Evidence register: P0 claims verified (A1, A3, B1, B3, B4, B7, C3, D1, D3, E1, F9); A2 partly verified
- [x] Repo scaffold: `web/` (Next.js PWA), `engine/` (FastAPI), `lab/` (simulation and analysis), `docs/`
- [x] Shared data contracts: `docs/data-contracts.md`
- [x] Design system: Arabic and English, right-to-left, 18px base text, high contrast, 56px buttons, state chips, "Simulated" badge. Showcase at `/en/design` and `/ar/design`. (Audio-first instruction pattern moves to Phase 1, where tasks need it.)
- [ ] Licensing check for AD8, IQCODE, BADLS (not blocking P0)
- [ ] Native Arabic speaker review of all Arabic copy

## Build notes
- **Locale routing:** every page lives under `app/[lang]`; `src/proxy.ts` redirects `/` by browser language. `<html dir>` is set on the server, so there is no right-to-left flicker.
- **PWA:** `app/manifest.ts`, PNG icons generated at `/icons/192`, `/icons/512`, `/icons/maskable`, and a hand-written `public/sw.js` (network-first pages, cache-first static assets). It registers only in production builds. If Phase 1 needs precaching of every task asset, switch to Serwist.
- **Next.js 16 specifics:** `proxy.ts` replaces middleware; `cacheComponents` is on; `PageProps`, `LayoutProps` and `RouteContext` are global type helpers (run `npx next typegen` after adding routes).
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
