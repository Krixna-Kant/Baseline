# 02 — Evidence Register

Rule: **cite or cut.** Every number in the pitch, UI copy or simulation parameters must appear here.

**Status:** `To verify` = taken from earlier research chats and not yet checked against the original paper. `Verified` = a team member opened the source and confirmed the number and its context. Change the status only after opening the source.

**Strength:** Strong / Moderate / Preliminary (how much weight the claim can carry).

## What verification changed (2026-11-20)

1. **Pitch wording, diagnosis delay:** "median 2 years, mean almost 3 years from first symptoms to diagnosis at a major Abu Dhabi hospital; longest when the first sign is forgetfulness." Memory-first presentations had the longest delay, which is exactly what Baseline targets.
2. **Weqaya priors:** use age-standardized or age-band rates, not crude rates. The sample was young (mean age 36.8) and the data are from 2009–10.
3. **Virtual supermarket:** cite its retest ICC as coming from 9 people. It shows why retest reliability needs proper study, which is our Lab's job.
4. **Arabic IQCODE:** validated for dementia, not early change. The simulation gives informants lower accuracy for early change than the published dementia numbers.
5. **POINTER:** the benefit is real but small (0.029 SD per year). Say "evidence-informed habits" and never promise prevention.
6. **Variability (IIV):** small effect (about 4% of variance), and mean reaction time predicted dementia more strongly. Variability stays a supporting signal; slowing in mean RT is a primary quick-response metric.

## A. Problem and local context

| ID | Claim | Used for | Strength | Status |
|---|---|---|---|---|
| A1 | Al Ain Hospital review (2010–2019): 825 dementia patients, 63% Emirati, mean age at diagnosis 78; mean 34.7 months (SD 28.8) onset-to-diagnosis, median 24 (IQR 12–48). Older age and memory-type first symptoms predicted longer delay; nationality did not. | Pathway model, pitch | Moderate (single site, retrospective records) | **Verified** — BJPsych International (Cambridge Core); PMC11738900 |
| A2 | Weqaya: started April 2008, screens nationals only, over 94% of adult national residents of Abu Dhabi screened | Data layer, pitch | Strong | Partly verified (start date and 94%, PMC3512533); 3-yearly mandate still to verify |
| A3 | Weqaya analysis (2009–2010) of 50,138 adults (72% recorded Emirati, mean age 36.8): crude obesity 35.4%, diabetes 17.6%, hypertension 23.1%, dyslipidemia 44.2%, smoking 11.6%; age-standardized obesity 41.1%, diabetes 24.6%, hypertension 29.2% | Simulation priors (use age-standardized or by age band) | Strong (but young sample, data from 2009–10) | **Verified** — AJPH 2012, doi 10.2105/AJPH.2011.300290 |
| A4 | Malaffi: about 3.5 billion records, 12.7 million patient profiles; patient portal app exists | Roadmap | Strong | To verify |
| A5 | UAE Healthy Future Study: about 15,000 Emiratis aged 18–40, record linkage consent, MRI phase | Roadmap | Strong | To verify |
| A6 | Emirati Genome Programme: over 900,000 genomes; APOE E4 in DoH pharmacogenomics reports | Genomics context | Moderate | To verify |
| A7 | Emiratis are about 20% of Abu Dhabi's population | Scope, languages | Moderate | To verify |
| A8 | Arab MoCA norms: lower scores in women, older and lower-education groups | Fair layer rationale | Moderate | To verify |
| A9 | Omani study: age and education strongly shape executive-task scores | Fair layer rationale | Moderate | To verify |

## B. Measurement and change detection

| ID | Claim | Used for | Strength | Status |
|---|---|---|---|---|
| B1 | Reliable change index (Jacobson and Truax, 1991); practice-adjusted versions (for example Chelune et al., 1993) | State engine | Strong | Verified (standard methods references) |
| B2 | z = −1.645 as one-tailed 95% "smaller than expected change" reference | Watch threshold | Strong (statistical convention) | Verified (statistics) |
| B3 | ICC interpretation bands: below 0.5 poor, 0.5–0.75 moderate, 0.75–0.9 good, above 0.9 excellent (Koo and Li, 2016) | Lab reporting | Strong | Verified (standard methods reference) |
| B4 | Burst designs give reliable digital cognitive scores. Sliwinski et al. 2018 (n = 219, ages 25–65): averaged smartphone scores reliability ≥ .97; about 10 sessions reach > .80. Older adults (n = 17, mean age 73): 2 sessions a day for 5 days, 5 bursts over 12 months; 94% retention, 97% compliance; burst-level reliability ≈ .79–.94+, burst-to-burst retest .85–.87 | Session design (supports our 7-day baseline and 5-day bursts) | Strong for reliability; older-adult evidence is a small sample | **Verified** — PMC5690878; PMC8225552 |
| B5 | Bayesian learning-model markers (learning rate, forgetting, variability, peak) | Fingerprint | Moderate | To verify |
| B6 | Hierarchical change-point models detected change years before diagnosis (clinical research sample) | Pitch rationale | Moderate | To verify |
| B7 | Intra-individual variability predicts later decline or MCI/dementia: meta-analysis of 13 longitudinal studies, r = .20 (95% CI .09–.31), HR 1.74 (95% CI 1.02–2.98); explains only about 4% of variance. Sydney MAS (n = 861, ages 70–90): complex-RT variability HR 1.43 per SD; mean RT HR 1.53–1.59 (mean RT the stronger predictor) | Variability signal, **supporting only**; also use mean RT | Moderate, small effect | **Verified** — Neuropsychology 2021, doi 10.1037/neu0000746; doi 10.1016/j.jagp.2015.12.005 |
| B8 | Variability rises with normal ageing, especially after 75, so needs age-banded norms | Fair layer | Moderate | To verify |
| B9 | Adaptive test built on a 54-item bank comparable to longer in-person assessment (MIRT) | Adaptive items | Moderate | To verify |
| B10 | DIF methods: Mantel-Haenszel (Holland and Thayer, 1988); logistic-regression DIF for uniform and non-uniform DIF (Swaminathan and Rogers, 1990); ETS delta categories, where A is \|Δ\| < 1 (negligible) and B/C is 1 or more (moderate to large) (Zwick, 2012); Benjamini–Hochberg false-discovery control (1995) | Fair layer; Lab amendment A4 | Strong | Verified (standard methods references) |
| B13 | ARC smartphone study (Nicosia et al., 2023; Knight ADRC, n = 290, ages 61–97, 268 CDR 0 and 22 CDR 0.5). Up to 4 sessions a day for 7 days. Retest ICC of the cycle-average > 0.85 for every task and the composite at about 6 months (n = 185) and 1 year (n = 83). Adherence 80.42% (81% CDR 0, 79% CDR 0.5); dropout 4.83%. **Research-centre volunteers (82% White in CDR 0), adherence measured within 7-day bursts, not a year of daily sessions** | Reality anchor for Lab reliability (ICC) and completion | Strong for reliability; adherence applies to a supported research cohort | **Verified** — PMC9985662 (Neuropsychology / Alzheimer's & Dementia 2023) |
| B14 | Year-long remote mobile assessment (DANA, Boston University ADRC, n = 33, mean age 73.5, 27% cognitively impaired). 17 assessments over a year; completion by deadline 60.6%, within the wider segment 78.8%, total cumulative 90.9%. On-schedule completion fell from 93.9% to 72.7% by the last segment | Anchor for long-run completion and how it fades | Preliminary (small sample) | **Verified** — PMC10571616 |
| B11 | Comfort with technology predicted digital test scores (NIH Toolbox study) | Covariate | Moderate | To verify |
| B12 | Expecting feedback linked to faster reaction times (M2C2) | Fixed task script | Preliminary | To verify |

## C. Everyday-task assessment

| ID | Claim | Used for | Strength | Status |
|---|---|---|---|---|
| C1 | Computerized everyday-task battery (doctor visit, medication, finances): amnestic MCI worse on all three | Task families | Moderate | To verify |
| C2 | Night Out Task separated MCI from healthy; execution time predicted real-world function | Task families | Moderate | To verify |
| C3 | Virtual Supermarket Program (China, 62 MCI, 64 controls): sensitivity 85.9%, specificity 79.0%, AUC 0.870 for MCI; retest ICC 0.588 **from only 9 controls**; authors say cultural adaptation may be needed. Turkish virtual supermarket: 81% correct classification for amnestic MCI. | Shopping task rationale, simulation priors | Moderate (small, case-control samples) | **Verified** — JMIR Serious Games 2021, PMID 34870610 |
| C4 | Digital IADL endpoints span five domains | Task coverage | Moderate | To verify |
| C5 | Older adults did worse on computerized than prop-based everyday tasks | Covariate rationale | Moderate | To verify |
| C6 | Numeric scoring can hurt adherence | Narrative results | Preliminary | To verify |

## D. Risk context and prevention

| ID | Claim | Used for | Strength | Status |
|---|---|---|---|---|
| D1 | Lancet Commission 2024: 14 modifiable risk factors (less education, hearing loss, high LDL cholesterol, depression, traumatic brain injury, physical inactivity, diabetes, smoking, hypertension, obesity, excessive alcohol, social isolation, air pollution, untreated vision loss); about 45% of dementia potentially preventable or delayable | Intake | Strong | **Verified** — Lancet 2024, doi 10.1016/S0140-6736(24)01296-0 |
| D2 | FINGER multidomain intervention | Prevention plan | Strong | To verify |
| D3 | US POINTER (n = 2,111, ages 60–79, at risk): structured multidomain lifestyle program improved global cognition more than self-guided, by 0.029 SD per year (95% CI 0.008–0.050); both groups improved. Benefit consistent in APOE ε4 carriers and non-carriers (interaction P = .95); larger in people with lower baseline cognition. | Genomics never gates advice; prevention plan | Strong (RCT) but **small effect**; do not overstate | **Verified** — JAMA 2025, NCT03688126 |
| D4 | APOE4 is a risk indicator, not deterministic | Genomics copy | Strong | To verify |
| D5 | Loneliness and dementia risk, HR about 1.31, holds with depression controlled | Check-in | Moderate | To verify |
| D6 | Neuroticism HR about 1.24, conscientiousness HR about 0.77; no consistent link to pathology (IPD) | Personality opt-in only | Moderate | To verify |
| D7 | Ramadan fasting changes sleep timing and duration | Ramadan covariate | Moderate | To verify (find source) |

## E. Informant tools (Arabic)

| ID | Claim | Used for | Strength | Status |
|---|---|---|---|---|
| E1 | Arabic IQCODE-16 (Lebanon, n = 236 aged 65+, half with no formal education): AUC 0.96; cutoff > 3.34 gives sensitivity 92.5%, specificity 94.4%; discrimination comparable with and without formal education. **Validated for mild-to-moderate dementia, not MCI or early change.** | Informant module; simulation informant-error parameters (treat early-change accuracy as lower) | Strong for dementia, outside UAE | **Verified** — Dement Geriatr Cogn Disord 2015, doi 10.1159/000437092; licensing still to check |
| E2 | Arabic AD8 validated | Informant module | Moderate | To verify; check licensing |
| E3 | Arabic BADLS validated | Function module | Moderate | To verify; check licensing |
| E4 | Arabic informant IADL scale validated | Function module | Moderate | To verify |

## F. Devices and agent

| ID | Claim | Used for | Strength | Status |
|---|---|---|---|---|
| F1 | Apple Health and Health Connect have no web API; PWA cannot read them | Device Hub design | Strong | To verify |
| F2 | Web Bluetooth works in Chrome on Android, not Safari on iOS | Device Hub design | Strong | To verify |
| F3 | Consumer watch: 95.9% sensitivity, 47.9% specificity for sleep versus wake | Sleep quality flag | Moderate | To verify |
| F4 | Wearable sleep errors largest in older participants | Sleep quality flag | Moderate | To verify |
| F5 | Older adults' acceptance of health agents mixed; privacy and dependence concerns | Agent design | Moderate | To verify |
| F6 | Embodied agents may improve accessibility for people with cognitive impairment | Noor | Preliminary | To verify |
| F7 | Voice gender and age had small, inconsistent effect on trust | Selectable persona | Moderate | To verify |
| F8 | Voice-based cognitive screener feasible, reliable, valid (n = 103); speech-recognition failure the main barrier | Voice mode, fallback | Preliminary | To verify |
| F9 | Oxford randomized preregistered study (n = 1,298; GPT-4o, Llama 3, Command R+): people using LLMs identified relevant conditions in under 34.5% and correct course of action in under 44.2% of cases, no better than controls; answers varied with small wording changes and mixed good and bad advice (for example a brain-bleed scenario told to lie down in a dark room) | "Engine decides" rule; red-flag scripts | Strong | **Verified** — Nature Medicine 2026, doi 10.1038/s41591-025-04074-y (red-teaming study still to verify) |
| F10 | Layered guardrails reduced, but did not remove, high-severity errors | Guardrails | Moderate | To verify |

## G. Regulatory (confirm with an advisor)

| ID | Claim | Used for | Status |
|---|---|---|---|
| G1 | UAE Federal Law No. 2 of 2019 limits storing health data outside the UAE | Hosting roadmap | To verify |
| G2 | ADHICS applies to Abu Dhabi healthcare entities | Security roadmap | To verify |
| G3 | UAE PDPL (Federal Decree-Law 45 of 2021) and its scope for health data | Consent design | To verify |
