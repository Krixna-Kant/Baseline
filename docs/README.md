# Baseline — Planning Docs

Baseline is a mobile-first PWA that builds a personal brain-health baseline, separates meaningful cognitive and functional change from normal variation, puts it in health and cultural context, and routes people to prevention or clinician review. It screens and monitors. It never diagnoses.

**Hackathon focus:** Requirement 6, *Validation and local population performance*. The app is the instrument. The **Validation Lab** is the main deliverable.

## Read in this order

| File | Purpose |
|---|---|
| [PROJECT-GUIDE.md](PROJECT-GUIDE.md) | **Start here:** everything that is built, how it works, how to run and test it |
| [00-project-overview.md](00-project-overview.md) | The full idea, architecture, workflow and user journey in one place |
| [01-problem-fit-review.md](01-problem-fit-review.md) | Does it solve the problem? Requirement-by-requirement check, gaps and fixes |
| [02-evidence-register.md](02-evidence-register.md) | Every claim we rely on, its strength, and whether it has been verified |
| [03-decisions-log.md](03-decisions-log.md) | Decisions made, plus open decisions the team still has to make |
| [phases/](phases/) | Build phases with goals, deliverables, tasks and acceptance criteria |
| [phases/PROGRESS.md](phases/PROGRESS.md) | Checklist tracker across all phases |
| [validation-report.md](validation-report.md) | Validation Lab results for threshold v1 |
| [demo-script.md](demo-script.md) | Four-minute demo with the Khalid story |
| [pitch-outline.md](pitch-outline.md) | Slide outline and judge Q&A, every number cited |
| [pilot-protocol.md](pilot-protocol.md) | What we would run next on real people |

## Phases at a glance

| Phase | Name | Priority | Main requirement(s) |
|---|---|---|---|
| 0 | Foundations and scope lock | P0 | All |
| 1 | Measurement core: task engine and check-in | P0 | 1 |
| 2 | Change engine: personal baseline and states | P0 | 2, 5 |
| 3 | Validation Lab: simulated cohort and metrics | P0 (hero) | 6 |
| 4 | Risk context, informant and Device Hub | P1 | 3 |
| 5 | Actions, prevention plan and clinician console | P1 | 4, 5 |
| 6 | Noor, the companion agent | P1 | 1, 4, 5 |
| 7 | Mini-pilot, demo and pitch | P0 | 6 |

P0 = required for a credible demo. P1 = strongly wanted. P2 items inside each phase are stretch goals.

Phases 2 and 3 should run **in parallel**. The Validation Lab needs the change engine, and the engine's thresholds are tuned in the Lab.

## Ground rules for every phase

1. **The engine decides, the LLM explains.** No state, score or threshold ever comes from the language model.
2. **Label what is simulated.** Anything synthetic carries a visible "Simulated" badge in the UI and in exported reports.
3. **Screening, not diagnosis.** No diagnostic words in user-facing copy. Uncertainty is always shown.
4. **No real patient data** in the hackathon build. The pilot uses consenting team members, friends and family under the pilot protocol only.
5. **Cite or cut.** A claim that does not trace to the evidence register does not appear in the pitch.
