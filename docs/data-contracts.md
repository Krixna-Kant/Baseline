# Data Contracts v0

Shared shapes for the web app, engine, agent and Lab. Described in plain terms; code types are generated from this in Phase 1.

**Every record has:** `id`, `user_id`, `created_at` (UTC), `source` (app, device, import, informant, clinician, simulation), `is_synthetic` (true or false), `consent_scope` (see below), `schema_version`.

## Consent scopes
`core` (tasks and check-in, required) · `informant` · `device` · `records_import` (Weqaya or Malaffi style) · `genomics` · `share_clinician` · `research_use`. Each can be granted or withdrawn with a timestamp. Withdrawing hides data everywhere immediately.

## Entities

### User
Language, persona choice (Noor or male persona, voice), year of birth (age band derived), sex, education level, digital familiarity score (0–3) and band, sensory check results (hearing, vision, adjustments made), assisted-mode default, informant links, timezone, Ramadan-awareness on or off.

### Session
User, session type (baseline burst, daily, retest burst), burst id, start and end time, device type, screen size, input mode (tap, voice, mixed), assisted flag, completed flag, offline flag.

### TaskResult
Session, task family, form id (parallel form), item ids, raw events (stimulus, response, timestamps), derived metrics (per family, defined in Phase 1), practice-round flag, validity flags (for example too fast, interrupted).

### CheckIn
Session, sleep hours, sleep quality (1–5), mood (1–5), stress (1–5), ill or in pain today, hearing ok today, vision ok today, loneliness (1–5), fasting today, new medication, caffeine.

### Reading (Device Hub)
Type (blood pressure, glucose, sleep duration, sleep regularity, steps, weight), value(s), unit, measured at, device model, measurement context (fasting, after exercise, etc.), quality flag (good, uncertain, poor), uncertainty note.

### RiskProfile
Lancet 2024 factors (each: yes, no, don't know, plus source), family history entries (relation, condition, age of onset), imported summaries (source, date), genomics (APOE status, visible to clinician only).

### InformantReport
Informant (relationship, language), questionnaire type and version, item answers, total, date, change versus previous report.

### StateDecision
User, state (Stable, Watch-context, Watch-unexplained, Review, Urgent), previous state, rule fired, top 3 drivers, confounders considered, change estimate and interval per family and composite, threshold version, engine version, decided at.

### Referral
StateDecision, route (primary care, neurology, geriatrics, mental health, audiology, optometry, emergency), packet snapshot, shared by user (yes or no, when), status (draft, shared, in review, decided).

### ClinicianReview
Referral, reviewer, decision (accept, override with reason, refer onward), onward route, notes, outcome (for example no impairment, reversible cause, MCI, dementia, other, pending), reviewed at.

### AgentMessage
User, role (user or agent), text, tools called, template id (if any), red-flag detected, created at. Read-only audit.
