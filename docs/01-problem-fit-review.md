# 01 — Problem-Fit Review

**Question:** Does Baseline actually solve the challenge?

**Verdict:** Yes, it addresses all six requirements, and the psychometric layer is a real differentiator. But it has six weaknesses a sharp judge would find. The biggest is that the team chose **Requirement 6 (validation)** as its focus, yet the concept treats validation as the last step. The fixes below are folded into the phases.

---

## 1. Requirement-by-requirement check

| # | Requirement | How Baseline meets it | Strength | Gap and fix |
|---|---|---|---|---|
| 1 | Culturally valid, accessible assessment | Everyday-life scenes co-designed for local life, Arabic and English with audio, large targets, voice and family-assisted modes, digital familiarity as a covariate, DIF checks | Strong | No local norms exist. **Fix:** make the *personal baseline* the primary reference (within-person comparison is less sensitive to culture and education than population norms); use population norms only as a secondary, labeled reference. Add a sensory pre-check and Gulf-dialect speech fallback. |
| 2 | Longitudinal change detection with clear thresholds | Burst design, Bayesian personal model adjusting for practice, sleep and mood; Stable, Watch, Review | Strong concept, thresholds vague | **Fix:** write explicit, versioned rules (reliable change with practice adjustment, persistence across two bursts, hysteresis so states do not flip-flop). See Phase 2. |
| 3 | Integrated risk context | Lancet 14 factors, family history, informant tools, Device Hub, Weqaya, Malaffi and genomics (synthetic) | Strong | Genomic disclosure is risky. **Fix:** APOE result is never shown raw to the user. It goes to the clinician packet with a genetic-counseling prompt. Risk context changes *advice*, never the cognitive *state*. |
| 4 | Personalized prevention and timely care | Plain-language story, FINGER/POINTER-style plan, routing to primary care, neurology, geriatrics, mental health, audiology, optometry | Strong | "Timely" is not measured yet. **Fix:** track flag-to-review and review-to-assessment times in the console. |
| 5 | Safety and human oversight | Screening not diagnosis, uncertainty ranges, mandatory clinician review, gentle wording, red-flag scripts, LLM explains and engine decides | Strong | **Fix:** add an audit log, a "why this state" explanation for every flag, and a hard rule that the agent cannot downgrade a Review state. |
| 6 | Validation and local performance | Simulated cohort plus small pilot, metrics split by language, age, education | **Weakest relative to its importance** | See section 2. This is our chosen focus, so it gets the most fixes. |

---

## 2. The six weaknesses a judge would find, and the fixes

### W1. Validation is an afterthought, but it is our chosen track
In the current concept, validation is one paragraph at the end, and the demo story is about Khalid, not about evidence.

**Fix:** make the **Validation Lab** a first-class product with its own screen in the demo. The pitch arc becomes: problem → instrument (brief) → **how well it works, for whom, and where it fails** → what the local pilot needs next. Khalid's journey is the walkthrough of the instrument; the Lab is the result.

### W2. Simulated validation can be circular
If we simulate data with the same model we detect with, sensitivity and specificity look perfect and mean nothing. Judges with a statistics background will spot this.

**Fix:**
- Generate data with a **different, richer model** than the detector: nonlinear decline shapes (linear, accelerating, step), heavy-tailed noise, practice effects that vary by person, missed sessions that are more common in people who are declining, context dips (sleep, illness, Ramadan), and floor and ceiling effects.
- Pull every simulation parameter from the evidence register, with a source column.
- Run **sensitivity analyses**: show how metrics move when noise, prevalence or practice effects change. Report a range, not one number.
- Label results as "operating characteristics under stated assumptions," never "accuracy."

### W3. False-referral burden is driven by prevalence, and we must show that
At low prevalence, even a good screen mostly produces false referrals. Example: sensitivity 0.80, specificity 0.90, prevalence 5% gives a positive predictive value of about 30%, so about 7 in 10 referrals would be false alarms.

**Fix:** this becomes a headline insight, not a weakness. Baseline uses a **two-stage gate**: a flag first triggers a retest burst and an informant check, and only persistent, corroborated change goes to Review. The Lab shows false referrals per 1,000 users per year with one stage versus two stages, and the cost in detection delay. This directly answers "false-referral burden."

### W4. "Time to clinical assessment" is not comparable to the local benchmark
The Al Ain figure (mean 34.7 months) is *symptom onset to diagnosis*. Our system can measure *flag to clinician review* and, in simulation, *true change onset to flag* (lead time).

**Fix:** report three separate numbers and never claim we "cut 34.7 months."
1. Simulated lead time: true change onset to Review flag.
2. Flag to clinician review: measured in the console (demo and pilot).
3. Modeled pathway comparison: usual care (symptom-triggered, parameterized from the Al Ain distribution) versus Baseline-triggered, clearly labeled as a model.

### W5. Scope is too large for a hackathon
Six task families, Device Hub with four input paths, an LLM agent with voice, clinician console, imports and a Validation Lab is more than one team can build well.

**Fix:** an MVP cut (also in `03-decisions-log.md`):
- **P0:** three scenario families (shopping-list memory, medication refill or bill-pay management, quick response), check-in, change engine, Validation Lab, minimal clinician console, Noor in text with optional voice.
- **P1:** errands and way-finding, informant questionnaire, Device Hub simulated feed and manual entry, prevention plan, referral packet.
- **P2:** voice-message speech task, live Web Bluetooth, file import, genomics toggle.

### W6. Local regulatory and cultural realities are missing
**Fix:** add to the pitch and the design.
- **Data residency and security:** UAE Federal Law No. 2 of 2019 (ICT in health fields) restricts storing health data outside the UAE. Abu Dhabi's ADHICS standard and the Department of Health's data policies apply. The roadmap says "UAE-hosted, ADHICS-aligned." The LLM must not receive identifiable health data in production without a UAE-compliant deployment. *Confirm exact obligations with a mentor or advisor.*
- **Ramadan and prayer times:** sleep timing and fasting change during Ramadan. The check-in asks about fasting, the engine widens its expected range, and session reminders avoid prayer times.
- **Population mix:** Emiratis are about 20% of Abu Dhabi residents. Demo in Arabic and English. Roadmap: Hindi, Urdu, Malayalam, Tagalog, with DIF checks for each.
- **Informant reality:** the closest daily observer may be a spouse, a child, or a domestic helper who speaks another language. Allow any informant type, record their relationship and language, and treat it as a covariate.
- **Agent persona:** offer female and male personas and Gulf Arabic or English voices. Some users may prefer a same-gender persona. Noor stays the default demo character.
- **Instrument licensing:** check permissions for AD8, IQCODE and BADLS before using their exact items. Until confirmed, use them only in the simulation as parameters and mark the questionnaire as "AD8-style, pending permission."

---

## 3. Additions that make the idea stronger

1. **Ipsative-first scoring.** Compare each person mainly to themselves. This is the cleanest answer to "one-off scores mislead" and "not validated for the local population."
2. **Two-stage referral gate** (see W3). It cuts false referrals and is easy to demonstrate.
3. **"Why this state" card.** Every Watch or Review shows the three biggest drivers (for example: "memory tasks lower in 2 bursts; family reports bill trouble; sleep normal, so sleep does not explain it").
4. **Confounder-first routing.** Before a cognitive referral, check reversible or measurement causes: sleep, mood, hearing, vision, new medication, acute illness, low vitamin B12 or thyroid follow-up as a clinician suggestion (never a self-diagnosis).
5. **Practice-effect handling.** Ungraded practice round, parallel forms, and a modeled learning curve. Failing to improve with practice is itself a signal in the literature. We use it as supporting evidence only.
6. **Fairness dashboard.** Completion, reliability and false-flag rate by language, age band, education and digital familiarity, with a flag when any group differs by more than a set margin.
7. **Pre-registered validation protocol.** Write the metrics, thresholds and analysis plan *before* running the simulation, and commit it with a timestamp. Simple, and it makes the results credible.
8. **Mini-pilot that measures what it can.** Completion, time per task, usability (System Usability Scale), test-retest reliability, and Arabic speech-recognition error rate. It **cannot** measure sensitivity, and we say so.
9. **Model cards and threshold versions.** Each threshold set has a version, the Lab result that justified it, and a date.
10. **Drop-out as a signal and a metric.** People who are declining often stop testing. The engine treats a long gap as "Watch: check in" (via a gentle nudge or the informant), and the Lab measures how missing data biases sensitivity.

---

## 4. Risks to manage

| Risk | Mitigation |
|---|---|
| Overclaiming accuracy | Labels everywhere, ranges not points, evidence register |
| False reassurance ("Stable" read as "healthy") | Stable copy: "no meaningful change in what we measure; this is not a check-up" plus symptom red flags always available |
| Anxiety from flags | Two-stage gate, gentle templates, Watch never mentions dementia |
| LLM saying something unsafe | Tool-only facts, templates for Review and Urgent, red-flag scripts, audit log, refusal of diagnostic questions |
| Arabic speech recognition failure | Typed and tap fallback for every voice step; measure the error rate in the pilot |
| Demo fragility | Seeded synthetic users and a time-lapse mode that do not depend on live APIs |

---

## 5. Bottom line

The idea solves the challenge, and the psychometric layer (fairness, personal model, context) is the right differentiator. With the fixes above, especially **making the Validation Lab the hero, avoiding circular simulation, and showing the two-stage gate's effect on false referrals**, it answers the chosen requirement more rigorously than a typical "app plus AI" entry.
