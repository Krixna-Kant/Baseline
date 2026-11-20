# Pitch Outline

Rule: every number traces to `docs/validation-report.md` (VR, with section) or the evidence register (ID). If a number is not in either, cut it.

## 1. Problem and local benchmark

- Median **2 years**, mean almost **3 years** (34.7 months) from first symptoms to diagnosis at a major Abu Dhabi hospital; longest when the first sign is forgetfulness. [A1]
- One-off tests compare people with population norms that were not built here, and cannot tell a bad night from a real change.

## 2. Our answer in one line

> Baseline learns each person's own normal through short everyday tasks, and only suggests a doctor when a change persists and context does not explain it.

## 3. How it works (one diagram)

Everyday tasks on a phone (shopping list, quick reactions, medicine sorting) → personal baseline (14 sessions) → change engine with context (sleep, illness, fasting, mood) → states Stable / Watch / Review / Urgent → plan, family check-in, doctor summary, clinician console.

## 4. Fair, Fingerprint, Context

- **Fair:** compared with yourself, not a norm; helped sessions, phone and voice input are adjusted for. Fairness checked by language, age, education and phone familiarity. [VR "Fairness"]
- **Fingerprint:** three activity areas, each with its own personal range and practice curve. [VR "Ablations": removing practice modelling drops sensitivity from 0.33 to 0.23]
- **Context:** removing context adjustment nearly doubles false referrals, **25.3 → 48.4** per 1,000 person-years. [VR "Ablations"]

## 5. Safety: the engine decides, the LLM explains

- In a randomized study, people using LLMs for medical scenarios found the right course of action in under 44% of cases, no better than controls. [F9]
- Noor reads only engine output; Review and Urgent text is template-locked; red flags go straight to a 998 script. Red-team suite: **54 prompts, 100% of red flags escalated, 0 invented numbers or states** (`npm run test:noor`).
- No identifiable health data goes to an LLM; the optional rephrase sends only the template text and is rejected if it changes a number or state.

## 6. Validation results (two slides)

**Slide A: what we promised before running anything** [VR "Pre-stated success criteria"]

| Criterion | Target | Result |
|---|---|---|
| Reliability (ICC) | ≥ 0.75 | 0.88 / 0.94 ✓ |
| 12-month specificity | ≥ 0.95 | 0.974 ✓ |
| False referrals per 1,000 person-years | ≤ 30 | 25.3 ✓ |
| Two-stage gate beats one-stage | fewer false referrals | 25.3 vs 58.7, +12 days ✓ |
| Fairness | gap ≤ 0.10, ratio ≤ 1.5 | gap 0.12 (education) ✗ |
| Item bias check | ≤ 5% false flags | 44–54% ✗ |

**Slide B: what it means** [VR "Main results", "Time to assessment", "Sensitivity analysis"]

- Sensitivity **0.33** at 12 months; flagged people reach Review a median **256 days** (about 8.5 months) after their simulated change began, against a 24-month median delay to diagnosis today [A1].
- If people complete their sessions, sensitivity rises to **0.60**: adherence is the biggest lever, which is why Noor and the family check-in exist.
- Pathway model: median **23.5 → 13.1 months** to assessment; assessed within a year **22% → 45%**. Model, not observed outcomes.

## 7. What is real, simulated, roadmap

| Real (built and running) | Simulated | Roadmap |
|---|---|---|
| PWA in Arabic and English, three everyday tasks, check-in | 10,000-person cohort and all accuracy numbers | Local pilot (see `docs/pilot-protocol.md`) |
| Change engine with versioned thresholds (v1) | Devices (BP cuff, sleep ring, steps) | Re-estimating thresholds on UAE data |
| Validation Lab, clinician console, Noor | Weqaya-style record import, genomics | UAE hosting, ADHICS alignment [G1, G2] |

## 8. Team and ask

- Team of two.
- Ask: a pilot partner (DoH, UAE Healthy Future Study or a hospital memory clinic), and access to de-identified local norms to re-run the Lab.

## Judge Q&A prep

| Question | Answer |
|---|---|
| "Isn't your simulation circular?" | The cohort generator is separate from the engine and has its own assumptions, listed in `params.yaml`. We report a sensitivity analysis (noise ×0.5 to ×2, prevalence halved and doubled, practice and context effects ±50%) and a failure report. Thresholds were tuned on this generator, so a local pilot must re-estimate them. |
| "How do you know it works for Emiratis?" | We don't yet. Comparing each person with themself reduces dependence on norms, and the language gap in simulation is 0.01, but a local pilot is required before any real use. |
| "What about false positives and anxiety?" | Two-stage gate: a dip opens Watch and asks for a few more sessions; Review needs the change to persist or a family member to notice. That halves false referrals (58.7 → 25.3 per 1,000 person-years). Users never see a number, only plain language. |
| "Why is sensitivity only 0.33?" | Most missed people stopped doing sessions (missed group: 36% mean completion, 76% dropped out). With full completion it is 0.60. We chose specificity first because false alarms cost trust and clinic time. |
| "Why an AI agent?" | Accessibility for older and low-familiarity users. It never decides, it is logged for the clinician, and the red-team suite checks it. |
| "Data privacy?" | Data stays on the device unless shared; seven separate consent switches; withdrawing consent hides the data everywhere. Synthetic data only in the demo. UAE hosting on the roadmap. |
| "Why did fairness and item bias fail?" | Education and phone familiarity gaps are just over the limit; we report them instead of tuning them away. The item-bias check found every planted biased item but over-flags fair ones; the item parameters are invented, so it shows the check works, not that our items are fair. |
