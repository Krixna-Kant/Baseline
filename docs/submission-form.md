# Submission form content

Copy each block into the matching field. Character counts include spaces.

---

## Solution summary (max 2000)

Baseline is a bilingual Arabic and English mobile web app that helps adults aged 50 and over in the UAE notice meaningful change in thinking and memory early. It compares each person with their own history rather than with population norms, which were mostly built on Western groups and fit Gulf populations poorly.

People complete a few minutes of everyday activities, such as remembering a shopping list, reacting quickly and sorting medicines, plus a short check-in on sleep, mood, illness and fasting. Fourteen sessions set a personal baseline. A change engine then tracks each activity area with a statistical filter, separates real change from normal day-to-day ups and downs, and discounts days explained by poor sleep, illness or Ramadan. One bad day only triggers repeat checks. A doctor visit is suggested only when change persists across independent repeat checks, or when a family member also reports everyday changes. A slow-change rule catches gradual drift.

Results are shown as plain states (Stable, Watch, Review, Urgent), never as scores. Each state comes with a next step: a personal prevention plan built on modifiable risk factors (blood pressure, sugar, hearing, sleep, activity, social contact), a family check-in, or a one-page summary for the family doctor that the person chooses to share. Noor, a voice-capable companion agent, explains results and records readings within strict limits: fixed safety wording, red-flag escalation to 998, and no identifiable health data sent to a language model.

A clinician console shows why each referral was suggested and records the outcome. A Validation Lab tests the whole pipeline on 10,000 synthetic people over two years under a pre-registered protocol, and publishes what fails as well as what passes. All data in the prototype is synthetic.

---

## Solution stage

Prototype

---

## What has been built during the challenge? (max 1500)

A working, open-source prototype:

- Installable PWA (Next.js, React, Tailwind) in Arabic and English, with right-to-left layout, three text sizes, offline support and all personal data kept on the device.
- Onboarding with phone-familiarity, hearing and vision checks; three everyday cognitive activities; daily check-in.
- Change engine (Python, FastAPI): personal baseline, filter with uncertainty ranges, context discounting, two-stage referral rule and slow-change rule; 26 automated tests.
- Prevention plan, health profile, family questionnaire, device hub (simulated cuff, glucometer and watch, plus spoken or typed readings) and a shareable doctor summary.
- Noor companion agent with a fixed tool contract and a 56-case red-team test suite.
- Clinician console with decision and outcome logging.
- Validation Lab on 10,000 synthetic people: sensitivity 0.33 to simulated change at 25 false referrals per 1,000 person-years; retest reliability 0.88 to 0.94; item-bias check with 0 false flags. The education fairness target is not yet met; we report this openly with the fixes we tested.
- Khalid demo: a five-month synthetic story from baseline to clinic review.

---

## Technology type

Tick:

- AI agent: Noor, the companion agent with tools and guardrails.
- Software application: the PWA, change engine and clinician console.
- Analytics: the Validation Lab and the per-person change detection.

Leave unticked:

- Machine learning: the engine uses classical statistics (a filter, a cumulative-sum rule, logistic regression for the bias check), not trained models. Tick it only if the judges read "machine learning" broadly.
- Wearable, Sensor, Connected device, Other hardware: device readings are simulated or typed in; no hardware was built or connected.

---

## Prototype / Deployment link

Source code: https://github.com/Krixna-Kant/Baseline

There is no live deployment yet. For a clickable link, the web app can be deployed to a host such as Vercel and the engine (FastAPI) to a Python host. Replace the line above with that URL once it is live. The latest UI redesign has not been pushed to GitHub yet.
