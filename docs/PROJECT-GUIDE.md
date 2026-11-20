# Baseline — Complete Project Guide

_Last updated: 20 November 2026. This file describes what is actually built and running in the repository today. For the original idea and research, see `00-project-overview.md`; for the plan per phase, see `phases/`._

---

## 1. What Baseline is

Baseline is a hackathon entry for the challenge **"Protecting Brain Health Earlier"**. It is a mobile-first web app (an installable PWA) in **Arabic and English** that:

1. Learns each person's **own normal** ("baseline") from short everyday activities done on a phone: remembering a shopping list, quick reactions, and sorting medicines into a weekly pill box.
2. Watches for **change over time** against that personal baseline, instead of comparing the person with population norms.
3. Takes **context** into account (poor sleep, illness, fasting in Ramadan, low mood, stress, new medicine, hearing or vision problems), so a bad week is not mistaken for real change.
4. Adds what a **family member** notices, plus **health context** (blood pressure, sugar, sleep, risk factors).
5. Turns the result into a plain-language status and a **next step**: carry on, do a few extra sessions, ask family, talk to a doctor, or get urgent help.
6. Gives a **clinician** a summary and a console to review, decide and record outcomes.
7. Includes **Noor**, an AI companion that explains things in simple words but **never decides** anything.
8. Proves how well this works with a **Validation Lab**: a simulated cohort of 10,000 synthetic people and a pre-registered set of success criteria.

**It screens and monitors. It never diagnoses.** Users never see a score or the word "dementia"; clinicians see the clinical details.

### The problem it targets

In Abu Dhabi, the median time from first symptoms to a dementia diagnosis is about **2 years** (mean almost 3 years), and the delay is longest when the first sign is forgetfulness (Al Ain Hospital study, evidence register item A1). One-off tests miss slow change and can mislabel people who simply had a bad night.

### Scope decisions

| Decision | Choice |
|---|---|
| Build focus | MVP for a hackathon; requirement 6 (validation and local population performance) is the hero |
| Team | Two people |
| Validation | Simulation only; no human pilot in the hackathon build (a pilot protocol is written for the roadmap) |
| Data | Synthetic only; nothing identifiable is ever sent to a language model |
| UI | Functional first; a visual restyle will follow from a reference the user will share |

---

## 2. The big picture

```
 ┌──────────────────────────────── Phone / browser (PWA) ─────────────────────────────────┐
 │                                                                                         │
 │  Onboarding ─► Session (check-in + 3 everyday tasks) ─► saved on the device            │
 │                                                       (localStorage "baseline:v1")      │
 │  Home status · Weekly story · Plan · Family check-in · Devices · Doctor summary         │
 │  Privacy · Clinician console (demo) · Validation Lab · Khalid demo · Noor companion     │
 │                                                                                         │
 └──────────────────────────────┬──────────────────────────────────────────────────────────┘
                                │  POST /api/engine/evaluate  (full history, raw events stripped)
                                ▼
 ┌──────────────────────── Change engine (Python, FastAPI, port 8000) ────────────────────┐
 │  Scoring ─► Fair layer ─► personal baseline + practice curve ─► local-level filter      │
 │  ─► context adjustment ─► state machine (Stable / Watch / Review / Urgent) ─► next step │
 └─────────────────────────────────────────────────────────────────────────────────────────┘
                                ▲
                                │  same engine code, vectorised over many users
 ┌──────────────────────── Validation Lab (Python) ────────────────────────────────────────┐
 │  Synthetic cohort generator ─► engine ─► metrics, fairness, reliability, item bias,     │
 │  pathway model, ablations, sensitivity analysis ─► report + results.json for the web   │
 └─────────────────────────────────────────────────────────────────────────────────────────┘
```

Key principle: **the engine decides, the language model explains.** No state, number or threshold ever comes from an LLM.

---

## 3. Repository layout

| Folder | What it contains | Stack |
|---|---|---|
| `web/` | The PWA: every screen, Noor, the demo, the Lab viewer | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4 |
| `engine/` | The change engine and its HTTP API | Python 3.11, FastAPI, NumPy, SciPy, Pydantic |
| `lab/` | The Validation Lab: cohort generator and metrics pipeline | Python 3.11, uses `engine` |
| `docs/` | Plan, evidence, protocol, report, demo and pitch material | Markdown |

### Important files

| File | Role |
|---|---|
| `web/src/lib/types.ts` | Data shapes: profile, consents, check-in, session, task result, risk profile, informant report, reading, referral |
| `web/src/lib/store.ts` | On-device store (`localStorage` key `baseline:v1`), consent helpers, `visibleData` (consent filter), Noor log |
| `web/src/lib/engine.ts` | Calls the engine; `enteringRule` finds the rule that started the current state |
| `web/src/lib/useEvaluation.ts` | Shared, cached engine call used by every screen |
| `web/src/lib/forms.ts`, `content.ts` | Seeded parallel forms for the tasks (different items each session) |
| `web/src/lib/context.ts` | Readings, units, levels, informant scoring, spoken-reading parser, simulated devices, synthetic record import |
| `web/src/lib/plan.ts` | Prevention plan goals, care routes, weekly story |
| `web/src/lib/packet.ts` | Doctor summary ("referral packet") builder |
| `web/src/lib/noor/core.ts` | Noor's brain: intent detection, red flags, replies from templates, LLM-rephrase guard |
| `web/src/lib/demo.ts` | Khalid, the scripted synthetic demo user |
| `web/src/i18n/dictionaries/en.json`, `ar.json` | All user-facing text in both languages (keys always match) |
| `engine/src/baseline_engine/config.py` | Every number that changes a decision, versioned (`v0`, `v1`) |
| `engine/src/baseline_engine/scoring.py` | Turns sessions into family scores, context flags and covariates |
| `engine/src/baseline_engine/core.py` | Vectorised model and state machine (shared by API and Lab) |
| `engine/src/baseline_engine/api.py` | `GET /health`, `POST /evaluate` |
| `lab/src/baseline_lab/params.yaml` | Every assumption of the simulated cohort, marked by source |
| `lab/src/baseline_lab/run.py` | One command that produces the whole validation report |

---

## 4. The app, screen by screen

All pages live under `/[lang]/...` where `lang` is `ar` or `en`. Opening `/` redirects to the browser's preferred language (`web/src/proxy.ts`). Arabic pages are right-to-left. The app name in Arabic is "بيسلاين".

### 4.1 Onboarding (`/onboarding`)

Steps: welcome → about you (birth year, sex, education; the language is the one the app is open in) → phone familiarity (three questions, giving a low/medium/high band) → hearing and seeing (and text size: 100%, 115% or 130%) → consent → finish.

Consent has **seven separate switches**: core (required), family input, devices, health-record import, genetic information, sharing with a clinician, and research use (off by default). They can be changed any time on the Privacy page.

### 4.2 Session (`/session`)

A session is a short check-in followed by three everyday activities. The order is fixed:

1. **Check-in:** sleep hours and quality, mood, stress, illness, hearing and vision today, loneliness, fasting, new medicine, caffeine, and a red-flag question (sudden symptoms). A red-flag answer stops the session and shows the **urgent screen** (call 998).
2. **Shopping list (memory), immediate recall:** study a list, then pick the items from a grid with distractors. Metric: discrimination = hit rate − false-alarm rate.
3. **Quick reactions (speed):** simple and choice reaction trials. Metrics: median reaction times, choice accuracy, variability (coefficient of variation), anticipations and lapses.
4. **Medicine sorting (planning):** place pills into a weekly organiser following instructions. Metrics: cell accuracy, omissions, commissions, perfect rows, time.
5. **Shopping list, delayed recall:** the same list again at the end.

Each activity has a **practice round the first time only**. Every session uses a **new parallel form** (different items, seeded), so people cannot simply learn the answers. Raw tap events are kept on the device; only derived metrics are sent to the engine. Validity flags (for example "no response" or "too few valid trials") exclude a task from scoring.

The first **14 completed sessions** build the baseline. After that, sessions are "daily".

### 4.3 Home (`/`)

- Progress through the baseline (x of 14), then the current status card.
- **Status card:** the state in plain words, a range bar ("your usual" vs "lower than usual", with an uncertainty band), the threshold version, and a collapsible "Details for the care team".
- **Your week:** sessions done, how each activity went compared with the person's usual, and context such as poor-sleep days.
- **Where to go:** care routes (see 4.6).
- A reminder banner if Noor scheduled a check.
- Links to every other screen, and "Delete all my data".

### 4.4 Health profile (`/health`)

Questions for the 13 modifiable risk factors from the Lancet Commission 2024 (hearing loss, vision loss, hypertension, diabetes, high LDL cholesterol, obesity, inactivity, smoking, alcohol, depression, social isolation, head injury, air pollution; education comes from onboarding), each with "Yes / No / Don't know". Also family history, and an optional **synthetic** genetic result (APOE ε4) which is **never shown to the user** and only appears in the clinician packet with a counselling prompt. Answers imported from records keep their source label. **Risk answers never change the cognitive state**; there is a test for that in the engine.

### 4.5 Family check-in (`/family`, `/family/answer`)

The person invites someone close (spouse, child, sibling, friend, caregiver) to answer **8 short questions** about everyday changes in the last year (AD8-style). Each answer is "changed / not changed / don't know". A total of **2 or more** counts as "new everyday difficulty", which the engine can use. The informant never sees the person's results.

### 4.6 Devices and readings (`/devices`)

- **Simulated devices:** blood-pressure cuff, glucose meter, sleep ring, step counter; each produces a week of synthetic readings marked "Simulated".
- **Say or type a reading:** for example "my pressure was 152 over 96" or "ضغطي ١٥٠ على ٩٥" (Arabic digits supported).
- **Health record summary:** a synthetic Weqaya-style import (blood pressure, HbA1c, weight, risk factors).
- Readings are levelled (for example blood pressure ≥ 140/90 is "above target"; fasting glucose ≥ 126 or random ≥ 200; HbA1c ≥ 6.5).

### 4.7 My healthy-steps plan (`/plan`)

Small weekly goals chosen from the person's answers and readings from eleven kinds: move a little more, blood pressure, blood sugar, heart-friendly plate, sleep, hearing, vision, social contact, keeping the mind active, smoking and mood. Each goal shows **why** it was suggested. During Ramadan (fasting recorded in check-ins) goals switch to Ramadan-friendly wording, such as walking after iftar. Genetic information is never used. Goals can be marked done for the week.

**Care routes** (also on Home): emergency, primary care with the doctor summary, primary care for blood pressure or glucose, mental health, audiology, optometry.

### 4.8 Summary for my doctor (`/packet`)

What Baseline would send to a clinic: age band, sex, education, language, phone familiarity, the engine's decision and the rule behind it, the composite and per-activity change with 95% ranges, the trajectory chart, context that was checked, family input, health context, latest readings, and genetics only if consented. It can be **shared** with the clinic (needs the "share with clinician" consent), **printed / saved as PDF**, or **downloaded as a data file**. The rule recorded is the one that **started** the current state (for example `decline_plus_informant`), not a "still in Review" hold rule.

### 4.9 My data and sharing (`/privacy`)

The seven consent switches. Turning one off **hides that data everywhere** (home, plan, packet, clinic, Noor) but keeps it until the person deletes it. "Delete all my data" wipes the device.

### 4.10 Clinician console (`/clinic`, demo)

In a real service this would run at the clinic with sign-in; here it reads summaries shared on the same device.

- **Metrics:** open cases, median flag-to-review time, overrides, outcomes recorded.
- **Review queue:** each shared case with state, rule, route and waiting time. Opening a case shows the full packet.
- **Decision:** accept, override (a reason is required) or refer onward.
- **Outcome:** no impairment, MCI, dementia, reversible cause, mood or sleep, sensory, or pending. Outcomes can be **exported as labels for the Lab**.
- **Noor conversation audit:** the last 100 messages with intent, tools used, whether the reply was template-locked, and whether it was rephrased by an LLM.

### 4.11 Validation Lab (`/lab`)

Reads `web/public/lab/results.json` from the last protocol run and shows: the pre-stated criteria (met or not), a **threshold explorer** (move the Watch threshold, switch one-stage vs two-stage gate), fairness by group, test-retest reliability, item-bias (DIF) check, time-to-assessment model, ablations, "what if our assumptions are wrong" scenarios, a time-lapse of three simulated people, where it fails, and the next step (local pilot). The full report is at `/lab/validation-report.md`.

### 4.12 Demo: Khalid's story (`/demo`)

See section 8.

### 4.13 Other

- `/design`: design-system page (colours, buttons, state chips).
- The app is installable (web manifest and generated icons); the service worker caches the app shell in production builds.
- Text size from onboarding applies across the app.

---

## 5. The change engine

### 5.1 API

| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness check |
| `POST /evaluate` | Body: `sessions` (full history), `informant` (date, newDifficulty, score), optional `reviewedAt` (last clinician decision). Returns `explanation` (current decision) and `trajectory` (state at every session) |

The engine is **stateless**: the phone sends its whole history every time, so nothing is stored on a server. The web app reaches it through `/api/engine/*` (rewritten to `http://127.0.0.1:8000`, or `ENGINE_URL`).

### 5.2 How a decision is made

1. **Scoring per session** (`scoring.py`), three "families":
   - memory = mean discrimination over immediate and delayed shopping recall;
   - speed = − mean log of median reaction time (higher is faster);
   - executive = pill-organiser cell accuracy, with a small penalty for taking longer than 30 seconds.
2. **Fair layer:** per-session adjustments for being helped, using a phone, or using voice input, so these do not look like change.
3. **Personal baseline:** built from the first **14** sessions, including an exponential **practice curve** (people get better at first; constant 3 sessions, capped), with a prior for each family's within-person spread.
4. **Local-level filter:** after the baseline, each family's level is tracked over time (a simple Kalman-style filter that allows slow drift), giving an estimate and its uncertainty in personal SD units.
5. **Context:** each context factor has an expected effect (for example poor sleep −0.30 SD, illness −0.40, fasting −0.20). If at least half of recent sessions had a context factor, a drop is called **context-explained**.
6. **Composite:** equal-weight average of the three families, converted to a z value.
7. **State machine** (below), then a **next step**.

### 5.3 States and rules

| State | Meaning for the user | Typical rule |
|---|---|---|
| Building | Baseline still being set | `baseline_building` |
| Stable | Within the usual range | `within_range`, `recovered`, `retest_cleared` |
| Watch (context) | A dip that context explains (sleep, illness, fasting…) | `context_explained_drop`, `hysteresis_hold` |
| Watch | An unexplained dip; a few extra sessions are requested | `rc_composite`, `rc_two_families`, `retest_in_progress` |
| Review | Suggest talking to a doctor | `persist_after_retest`, `decline_plus_informant`, `rapid_drop`, `one_stage_gate`, then `review_hold` |
| Urgent | Sudden symptoms reported | `red_flag` |

How Review is reached with the **two-stage gate** (the chosen setting):
- An unexplained dip below the Watch threshold opens **Watch**, and a **retest burst of 4 sessions** is judged on its own.
- If the burst confirms the change → Review (`persist_after_retest`). If not → back to Stable.
- Shortcuts: a very large drop within 28 days (`rapid_drop`), or a dip plus a recent family report of new difficulty within 90 days (`decline_plus_informant`).
- Review holds until a clinician decision (`reviewedAt`) is recorded.
- A red flag in a check-in shows Urgent immediately.

Next steps: complete baseline, normal schedule, retest in 3–7 days, retest burst and informant check, clinician review, urgent care now, gentle nudge then informant check.

### 5.4 Threshold versions

| Version | Watch z | Rapid-drop z | Gate | Status |
|---|---|---|---|---|
| v0 | −1.645 | −2.33 | two-stage | Provisional, before the Lab |
| **v1** | **−2.5** | **−3.2** | **two-stage** | **Current default**, chosen by the pre-registered rule in the Lab run |

Every decision returns its `thresholdVersion`, so any state can be traced to the exact settings.

---

## 6. The Validation Lab

### 6.1 Method

- A **pre-registered protocol** (`docs/validation-protocol.md`) was written before any results: questions, metrics, success criteria and the rule for choosing thresholds.
- The **generator** (`lab/src/baseline_lab/generator.py`, parameters in `params.yaml`) creates synthetic people who differ from what the engine assumes on purpose: heavy-tailed noise, varied practice curves, item floors and ceilings, mis-sized context effects, Ramadan, illness, drop-out that depends on the person, informants who are sometimes wrong, and a mix of trajectories (stable, ageing drift, transient dips, slow, accelerating and step changes).
- The **same engine code** runs over all simulated users.
- Run: `.\.venv\Scripts\python -m baseline_lab.run` (10,000 users, seed 20261120, about 40 minutes). `--fast` gives a quick, non-reportable run.

### 6.2 Results (protocol run, threshold v1)

| Criterion | Target | Result | Met |
|---|---|---|---|
| Test-retest reliability (ICC) | ≥ 0.75 | 0.88 (baseline halves) / 0.94 (consecutive blocks) | Yes |
| 12-month specificity | ≥ 0.95 | 0.974 (0.971–0.978) | Yes |
| False referrals per 1,000 person-years | ≤ 30 | 25.3 (23.0–27.7) | Yes |
| Two-stage vs one-stage gate | fewer false referrals; ≤ 30 days extra delay | 25.3 vs 58.7; +12 days | Yes |
| Fairness | sensitivity gap ≤ 0.10; false-referral ratio ≤ 1.5 | gap 0.12 (education), ratio 1.47 | **No** |
| Item bias (DIF) | find ≥ 2 of 3 planted items; ≤ 5% false flags | found 3 of 3 in both families, but 44–54% false flags | **No** |

Other results:
- Sensitivity at 12 months **0.33** (no pass mark; reported honestly). With full session completion it rises to **0.60**, so adherence is the biggest lever.
- Positive predictive value 0.48; session completion 0.54.
- Median time from simulated onset to Review: **256 days**.
- Ablations: removing context adjustment nearly doubles false referrals (25.3 → 48.4 per 1,000 person-years); removing practice modelling drops sensitivity to 0.23.
- **Pathway model** (using the Al Ain delay data; a model, not observed outcomes): median time from onset to assessment 23.5 → 13.1 months; assessed within 12 months 22% → 45%.
- Missed people are mostly slow changers with low completion and drop-out.

Full details: `docs/validation-report.md`.

---

## 7. Noor, the companion agent

### 7.1 What it does

A floating "Ask Noor" button opens a chat panel (hidden during sessions, onboarding, the clinic, the Lab and the family answer page). Noor can:

- explain the current status and the weekly story;
- suggest this week's plan, open the doctor summary or the family check-in;
- tell when the next check is, and set a reminder;
- note a reading said in words (blood pressure, sugar, etc.) **after the user confirms** (and only with device consent);
- note poor sleep into the next check-in, again after confirmation;
- answer who it is and what it can do.

Two personas: **Noor** (female) and **Rashid** (male), with an abstract animated light-orb avatar (idle, listening, thinking, speaking). Voice output and microphone input use the browser's speech features (Chrome or Edge); typing always works.

### 7.2 Guardrails

1. **Facts only through tools:** `get_state`, `get_trajectory_summary`, `get_template`, `get_goal`, `draft_packet`, `invite_informant`, `schedule_retest`, `escalate`.
2. **Red flags first:** stroke signs, sudden confusion, sudden severe headache, chest pain, fainting, head injury, seizure, sudden vision loss and self-harm, in English and Arabic, go straight to the 998 urgent message.
3. **Review and Urgent text is template-only** and locked; nobody can talk Noor out of it.
4. **Boundaries:** "Do I have dementia?" gets a fixed answer and an offer to share with a doctor; requests to hide results from family or clinicians, medication advice, raw numbers, and emotional-dependence messages get safe fixed replies.
5. **Optional LLM rephrase:** off unless `NOOR_LLM_API_KEY` is set. Only the template text is sent (never health data), and the rephrase is rejected if it changes a number, adds a state word, adds a banned word or gets too long.
6. **Everything is logged** for the clinician audit view.

### 7.3 Red-team tests

`web/tests/noor.redteam.test.ts`: 56 tests, all passing. They cover 23 red-flag prompts (both languages), 22 boundary prompts, prompt injection that tries to change the state, confirmation before saving, global checks (no invented numbers, no other state's text, no banned words), the rephrase guard, and that every suggestion button reaches the right answer in both languages.

---

## 8. Khalid, the demo story

`/demo` (`/ar/demo` in Arabic) loads any moment of a scripted synthetic person. Khalid is 64, lives in Al Ain, and has high blood pressure and diabetes. His history is generated from a fixed seed in `web/src/lib/demo.ts`; **the live engine makes every decision**.

| # | Story day | What happens | Engine result | Screen opened |
|---|---|---|---|---|
| 1 | 30 | 14 baseline sessions done | Stable | Home |
| 2 | 46 | A week of poor sleep (days 37–46) | Watch, context-explained | Home |
| 3 | 106 | Ramadan fasting (days 76–105) | Stable, nothing raised; Ramadan goals | Plan |
| 4 | 145 | A gradual change from day 114 persists | Watch (from day 142), retest in progress | Family check-in |
| 5 | 152 | Daughter Mariam's family report on day 146 (4 of 8) | Review on day 147 via `decline_plus_informant` | Doctor summary |
| 6 | 152 | Summary shared | Case waiting in the clinician queue | Clinician console |

`npm run test:demo` checks that every moment still lands on these states. The 4-minute presentation script is in `docs/demo-script.md`.

---

## 9. Privacy, safety and wording rules

- **On-device by default:** everything is stored in the browser. Only derived metrics go to the stateless engine; nothing leaves the device for a clinic unless the person presses Share.
- **Consent controls everything:** withdrawn consent hides that data on every screen and in Noor.
- **Synthetic data only** in this build, marked with "Simulated" badges.
- **Wording rules** (`docs/copy-guidelines.md`): user-facing text never uses diagnosis/diagnose, dementia, Alzheimer's, impaired/impairment, failed, abnormal, decline, score or test. Clinician screens may use clinical terms.
- **Security headers:** `nosniff`, frame denial, strict referrer policy; strict content-security policy on the service worker.
- **Evidence rule:** every number in the pitch or UI must trace to `docs/02-evidence-register.md` or the validation report ("cite or cut").

---

## 10. How to run everything

### First-time setup

```powershell
# From the repo root
python -m venv .venv
.\.venv\Scripts\python -m pip install -e "engine[api,dev]" -e lab

cd web
npm install
```

### Every day

```powershell
# Terminal 1 (repo root): the engine
.\.venv\Scripts\python -m uvicorn baseline_engine.api:app --port 8000

# Terminal 2: the app
cd web
npm run dev          # http://localhost:3000
```

For the demo on stage use a production build (`npm run build; npm run start`), which also enables the service worker. If the engine is not running, sessions still save on the device and the home screen says results could not be reached.

### Optional: Noor's LLM rephrase

Set `NOOR_LLM_API_KEY` (and optionally `NOOR_LLM_BASE_URL`, `NOOR_LLM_MODEL`, default `gpt-4o-mini`) before `npm run dev`. Without it Noor uses its approved templates only.

### Re-running the Lab

```powershell
.\.venv\Scripts\python -m baseline_lab.run          # full protocol run (~40 min)
.\.venv\Scripts\python -m baseline_lab.run --fast   # quick check, not reportable
```

It writes `lab/outputs/`, `docs/validation-report.md`, and the web copies in `web/public/lab/`.

---

## 11. Testing

| What | Command | Current result |
|---|---|---|
| Engine (hand-made scenarios, API, risk context never changes state) | `.\.venv\Scripts\python -m pytest engine` | 21 passed |
| Lab | `.\.venv\Scripts\python -m pytest lab` | 3 passed |
| Noor red-team | `cd web; npm run test:noor` | 56 passed |
| Khalid story (needs the engine running) | `cd web; npm run test:demo` | 3 passed |
| Types | `cd web; npx tsc --noEmit` | clean |
| Lint | `cd web; npx eslint src tests` | clean |

### Manual test checklist

1. Onboard in Arabic and in English; check right-to-left layout.
2. Do a full session; check practice rounds appear only the first time.
3. Answer the red-flag question "yes" in a check-in: the urgent 998 screen appears.
4. Devices: simulate a week, type "152 over 96", import the record summary.
5. Family: answer the 8 questions with 2 or more changes.
6. Privacy: turn off device consent and check readings disappear from the packet; turn it back on.
7. Packet: share it, then open the clinic, override (a reason is required), record an outcome.
8. Noor: try the suggestion buttons, a spoken reading, a red flag, "do I have dementia?", then check the audit log in the clinic.
9. Demo: load each Khalid moment and compare with the table in section 8.

---

## 12. Build history

| Commit | Content |
|---|---|
| Phases 0–2 | Foundations, locale routing, design system, PWA shell; measurement core (three activities, check-in, session flow); vectorised engine with tests and API |
| `a7beed4` | Phases 4–5: health intake, informant, Device Hub, consent controls, plan, routing, referral packet, clinician console; Lab UI |
| `5391fba` | Phase 3: protocol Lab run (10,000 users) and engine default thresholds v1 |
| `0b596bc` | Phase 6: Noor with tool contract, templates, red-flag escalation, audit log, red-team suite |
| `8abd7cc` | Phase 7: Khalid demo page and story tests, entering-rule fix, demo script, pitch outline, pilot protocol |
| `e1110c5` | Noor fixes: crash on newer Chrome (an effect returned the scroll promise); "What can I do this week?" now opens the plan |

### Phase status

| Phase | Status |
|---|---|
| 0 Foundations | Done |
| 1 Measurement core | Done (bill-payment task deferred) |
| 2 Change engine | Done |
| 3 Validation Lab | Done |
| 4 Risk context and Device Hub | Done (Web Bluetooth and FHIR import cut) |
| 5 Actions and clinician console | Done |
| 6 Noor | Done (voice uses browser speech; no Gulf-dialect voice model) |
| 7 Demo and pitch | In progress: demo page, script, pitch outline and pilot protocol done |

---

## 13. What is left

1. **UI restyle** from the reference you will share.
2. Rehearse the demo three times under 4 minutes; record the backup video.
3. Make the pitch slides from `docs/pitch-outline.md` (after the restyle, so screenshots match).
4. Optional: verify the remaining "To verify" items in the evidence register before quoting them.

## 14. Known limits (say these openly)

- All accuracy numbers come from a **simulated** cohort; thresholds were tuned on that generator and must be re-estimated on real people.
- Fairness (education and phone-familiarity gaps) and the item-bias check did **not** meet their targets.
- Sensitivity is modest (0.33) and depends heavily on people completing sessions.
- The clinician console is a same-device demo without sign-in; real use needs UAE hosting, sign-in and an audit trail.
- Devices, record import and genetics are simulated.
- Voice depends on the browser and is not tuned for Gulf Arabic.

---

## 15. Glossary

| Term | Meaning |
|---|---|
| Baseline | A person's own usual level, learned from their first 14 sessions |
| Family (activity area) | Memory (shopping list), speed (quick reactions), executive / planning (medicine sorting) |
| Parallel form | A different but equivalent version of an activity, so results are not just memorised |
| Composite | The combined change across the three families |
| z | How unusual a change is compared with the person's own spread; more negative = bigger drop |
| Context-explained | A drop that recorded context (sleep, illness, fasting…) can account for |
| Two-stage gate | Watch first, then confirm with extra sessions before suggesting a doctor |
| Informant | A family member or friend who answers the 8 everyday-change questions |
| Packet | The doctor summary the person can share |
| ICC | Intraclass correlation: how well repeated results agree (above 0.75 is good) |
| DIF | Differential item functioning: whether an item behaves differently for different groups |
| PPV | Positive predictive value: of people sent to Review, the share who truly had change |
| Person-years | Total years of follow-up across people; used to express false referrals per 1,000 |
