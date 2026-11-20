# 02 — Evidence Register

Rule: **cite or cut.** Every number in the pitch, UI copy or simulation parameters must appear here.

**Status:** `To verify` = taken from earlier research chats and not yet checked against the original paper. `Verified` = a team member opened the source and confirmed the number and its context. Change the status only after opening the source.

**Strength:** Strong / Moderate / Preliminary (how much weight the claim can carry).

## A. Problem and local context

| ID | Claim | Used for | Strength | Status |
|---|---|---|---|---|
| A1 | Al Ain Hospital review: 825 dementia patients, 63% Emirati, mean 34.7 months onset-to-diagnosis (median 24), longer in older adults | Pathway model, pitch | Moderate (single site) | To verify |
| A2 | Weqaya: started 2008, 3-yearly screening for Emiratis, over 94% of adult nationals screened | Data layer, pitch | Strong | To verify |
| A3 | Weqaya analysis of 50,138 people: obesity 35%, diabetes 18%, hypertension 23% | Simulation priors | Strong | To verify |
| A4 | Malaffi: about 3.5 billion records, 12.7 million patient profiles; patient portal app exists | Roadmap | Strong | To verify |
| A5 | UAE Healthy Future Study: about 15,000 Emiratis aged 18–40, record linkage consent, MRI phase | Roadmap | Strong | To verify |
| A6 | Emirati Genome Programme: over 900,000 genomes; APOE E4 in DoH pharmacogenomics reports | Genomics context | Moderate | To verify |
| A7 | Emiratis are about 20% of Abu Dhabi's population | Scope, languages | Moderate | To verify |
| A8 | Arab MoCA norms: lower scores in women, older and lower-education groups | Fair layer rationale | Moderate | To verify |
| A9 | Omani study: age and education strongly shape executive-task scores | Fair layer rationale | Moderate | To verify |

## B. Measurement and change detection

| ID | Claim | Used for | Strength | Status |
|---|---|---|---|---|
| B1 | Reliable change index (Jacobson and Truax, 1991); practice-adjusted versions (for example Chelune et al., 1993) | State engine | Strong | To verify |
| B2 | z = −1.645 as one-tailed 95% "smaller than expected change" reference | Watch threshold | Strong (statistical convention) | Verified (statistics) |
| B3 | ICC interpretation bands: below 0.5 poor, 0.5–0.75 moderate, 0.75–0.9 good, above 0.9 excellent (Koo and Li, 2016) | Lab reporting | Strong | To verify |
| B4 | Burst designs improve reliability of digital cognitive measures | Session design | Strong | To verify |
| B5 | Bayesian learning-model markers (learning rate, forgetting, variability, peak) | Fingerprint | Moderate | To verify |
| B6 | Hierarchical change-point models detected change years before diagnosis (clinical research sample) | Pitch rationale | Moderate | To verify |
| B7 | Intra-individual variability predicts decline and dementia (meta-analysis) | Variability signal | Moderate | To verify |
| B8 | Variability rises with normal ageing, especially after 75, so needs age-banded norms | Fair layer | Moderate | To verify |
| B9 | Adaptive test built on a 54-item bank comparable to longer in-person assessment (MIRT) | Adaptive items | Moderate | To verify |
| B10 | DIF methods (Mantel-Haenszel, logistic-regression DIF) | Fair layer | Strong | To verify |
| B11 | Comfort with technology predicted digital test scores (NIH Toolbox study) | Covariate | Moderate | To verify |
| B12 | Expecting feedback linked to faster reaction times (M2C2) | Fixed task script | Preliminary | To verify |

## C. Everyday-task assessment

| ID | Claim | Used for | Strength | Status |
|---|---|---|---|---|
| C1 | Computerized everyday-task battery (doctor visit, medication, finances): amnestic MCI worse on all three | Task families | Moderate | To verify |
| C2 | Night Out Task separated MCI from healthy; execution time predicted real-world function | Task families | Moderate | To verify |
| C3 | Virtual supermarket: sensitivity 85.9%, specificity 79.0% for MCI; test-retest r = 0.59; cultural adaptation needed | Shopping task, simulation priors | Moderate | To verify |
| C4 | Digital IADL endpoints span five domains | Task coverage | Moderate | To verify |
| C5 | Older adults did worse on computerized than prop-based everyday tasks | Covariate rationale | Moderate | To verify |
| C6 | Numeric scoring can hurt adherence | Narrative results | Preliminary | To verify |

## D. Risk context and prevention

| ID | Claim | Used for | Strength | Status |
|---|---|---|---|---|
| D1 | Lancet Commission 2024: 14 modifiable risk factors | Intake | Strong | To verify |
| D2 | FINGER multidomain intervention | Prevention plan | Strong | To verify |
| D3 | US POINTER: lifestyle benefit regardless of APOE4 | Genomics never gates advice | Strong | To verify |
| D4 | APOE4 is a risk indicator, not deterministic | Genomics copy | Strong | To verify |
| D5 | Loneliness and dementia risk, HR about 1.31, holds with depression controlled | Check-in | Moderate | To verify |
| D6 | Neuroticism HR about 1.24, conscientiousness HR about 0.77; no consistent link to pathology (IPD) | Personality opt-in only | Moderate | To verify |
| D7 | Ramadan fasting changes sleep timing and duration | Ramadan covariate | Moderate | To verify (find source) |

## E. Informant tools (Arabic)

| ID | Claim | Used for | Strength | Status |
|---|---|---|---|---|
| E1 | A-IQCODE-16: AUC 0.96, not affected by education | Informant module | Strong (outside UAE) | To verify; check licensing |
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
| F9 | LLM chatbots give inaccurate or inconsistent medical advice and can miss urgency (Oxford study; red-teaming study) | "Engine decides" rule | Strong | To verify |
| F10 | Layered guardrails reduced, but did not remove, high-severity errors | Guardrails | Moderate | To verify |

## G. Regulatory (confirm with an advisor)

| ID | Claim | Used for | Status |
|---|---|---|---|
| G1 | UAE Federal Law No. 2 of 2019 limits storing health data outside the UAE | Hosting roadmap | To verify |
| G2 | ADHICS applies to Abu Dhabi healthcare entities | Security roadmap | To verify |
| G3 | UAE PDPL (Federal Decree-Law 45 of 2021) and its scope for health data | Consent design | To verify |
