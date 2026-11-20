"""Markdown validation report built from results.json (protocol section 8 reporting rules)."""

from __future__ import annotations


def _f(x, d=3):
    return "n/a" if x is None else f"{x:.{d}f}"


def _ci(m: dict, d=3, scale=1.0) -> str:
    if m.get("est") is None:
        return "n/a"
    s = f"{m['est'] * scale:.{d}f}"
    if m.get("lo") is not None and m.get("hi") is not None:
        s += f" ({m['lo'] * scale:.{d}f}–{m['hi'] * scale:.{d}f})"
    return s


def write_report(r: dict) -> str:
    m, v1 = r["meta"], r["v1"]
    L: list[str] = []
    add = L.append
    add(f"# Validation Report — threshold v1 ({m['generated_at'][:10]})")
    add("")
    add(
        "**Simulated data only.** Every number below describes how Baseline's change-detection and referral rules behave on a "
        f"synthetic cohort of {m['n_users']:,} people generated under stated assumptions (protocol v{m['protocol_version']}, "
        f"amendments {', '.join(m['amendments'])}). They are operating characteristics, **not clinical accuracy**. "
        "No real participants were involved. The generator was written to differ from the detector "
        "(heavy-tailed noise, varied practice curves, item-level floors and ceilings, mis-sized context effects, informative "
        "drop-out), but it is still a model and real people will differ."
    )
    add("")
    if m.get("fast_mode"):
        add("> **Development run (fast mode). Not reportable.**")
        add("")
    add(
        f"Seed `{m['seed']}` · generator `{m['generator_version']}` · engine `{m['engine_version']}` · "
        f"{m['n_bootstrap']} bootstrap resamples · runtime {m['runtime_seconds']} s · intervals are 95% bootstrap over users."
    )
    add("")

    add("## Pre-stated success criteria")
    add("")
    add("| Criterion | Target | Result | Met |")
    add("|---|---|---|---|")
    for c in r["criteria"]:
        add(f"| {c['name']} | {c['target']} | {c['value']} | {'Yes' if c['pass'] else '**No**'} |")
    add("")
    add("Sensitivity has no pass mark; it is reported at the chosen threshold.")
    add("")

    add("## Threshold v1")
    add("")
    add(f"Chosen: **Watch z = {v1['watch_z']}**, rapid-drop z = {v1['rapid_z']}, **{v1['gate'].replace('_', '-')} gate**.")
    add(f"Rule applied: {v1['rule']}.")
    if v1["fails"]:
        add(f"Constraints not met at v1: {', '.join(v1['fails'])}.")
    add("")
    add("| Gate | Watch z | Sensitivity 12 m | Specificity 12 m | False / 1,000 py | PPV | Median lead (days) | Worst sens. gap | Worst false ratio | Meets all |")
    add("|---|---|---|---|---|---|---|---|---|---|")
    for s in r["sweep"]:
        add(
            f"| {s['gate'].replace('_', '-')} | {s['watch_z']} | {_f(s['sensitivity_12m'])} | {_f(s['specificity_12m'])} | "
            f"{_f(s['false_reviews_per_1000_py'], 1)} | {_f(s['ppv'])} | {_f(s['lead_days_median'], 0)} | "
            f"{_f(s['worst_sensitivity_gap'], 2)} | {_f(s['worst_false_ratio'], 2)} | {'Yes' if s['feasible'] else 'No'} |"
        )
    add("")

    mm = r["main"]
    add("## Main results at v1 (daily arm)")
    add("")
    add("| Metric | Estimate (95% interval) |")
    add("|---|---|")
    add(f"| 12-month sensitivity | {_ci(mm['sensitivity_12m'])} |")
    add(f"| 12-month specificity | {_ci(mm['specificity_12m'])} |")
    add(f"| False Reviews per 1,000 person-years | {_ci(mm['false_reviews_per_1000_py'], 1)} |")
    add(f"| Positive predictive value of Review | {_ci(mm['ppv'])} |")
    add(f"| Median lead time, onset to Review (days) | {_ci(mm['lead_days_median'], 0)} |")
    add(f"| Session completion | {_ci(mm['completion'])} |")
    add(f"| Baseline-burst completion | {_ci(mm['baseline_completion'])} |")
    add(f"| Drop-out (no session for 60+ days) | {_ci(mm['dropout'])} |")
    add("")
    add(f"Eligible decliners: {mm['n_eligible_decliners']:,} of {mm['n_users']:,} users.")
    add("")

    add("## Results by segment")
    add("")
    add("Low n: fewer than 200 users, or fewer than 50 eligible decliners for sensitivity (A3).")
    add("")
    add("| Variable | Group | Users | Sensitivity | Specificity | False / 1,000 py | Completion | Note |")
    add("|---|---|---|---|---|---|---|---|")
    for var, groups in r["segments"].items():
        for g, s in groups.items():
            note = "low n" if s["low_n"] else ("low n (decliners)" if s["low_n_decliners"] else "")
            add(
                f"| {var} | {g} | {s['n_users']:,} | {_ci(s['sensitivity_12m'], 2)} | {_ci(s['specificity_12m'], 3)} | "
                f"{_ci(s['false_reviews_per_1000_py'], 1)} | {_ci(s['completion'], 2)} | {note} |"
            )
    add("")

    add("## Fairness (section 5.2 constraints)")
    add("")
    add("| Variable | Sensitivity gap (limit 0.10) | False-referral ratio (limit 1.5) | Excluded (low n) |")
    add("|---|---|---|---|")
    for var, f in r["fairness"].items():
        add(f"| {var} | {_f(f['sensitivity_gap'], 2)} {'' if f['sensitivity_gap'] <= 0.10 else '**over**'} | {_f(f['false_ratio'], 2)} {'' if f['false_ratio'] <= 1.5 else '**over**'} | {', '.join(f['excluded']) or '—'} |")
    add("")

    g = r["gate_comparison"]
    add("## One-stage vs two-stage gate (same Watch z)")
    add("")
    add("| Gate | Sensitivity | Specificity | False / 1,000 py | Median lead (days) |")
    add("|---|---|---|---|---|")
    for k in ("one_stage", "two_stage"):
        s = g[k]
        add(f"| {k.replace('_', '-')} | {_ci(s['sensitivity_12m'])} | {_ci(s['specificity_12m'])} | {_ci(s['false_reviews_per_1000_py'], 1)} | {_ci(s['lead_days_median'], 0)} |")
    add("")
    add(f"Median extra delay from the retest stage, in decliners detected under both gates: **{_f(g['extra_delay_days_median'], 0)} days** (n = {g['n_detected_by_both']}).")
    add("")

    rel = r["reliability"]
    add("## Test-retest reliability (Stable users)")
    add("")
    add("| Comparison | Measure | ICC(2,1) (95% interval) | Bland-Altman bias | 95% limits of agreement | n |")
    add("|---|---|---|---|---|---|")
    for comp in ("baseline_halves", "consecutive_blocks"):
        for fam, x in rel[comp].items():
            add(f"| {comp.replace('_', ' ')} | {fam} | {_f(x['icc'], 2)} ({_f(x['lo'], 2)}–{_f(x['hi'], 2)}) | {_f(x['bland_altman_bias'], 2)} | {_f(x['loa_low'], 2)} to {_f(x['loa_high'], 2)} | {x['n']:,} |")
    add("")
    add("Units are between-person SDs. Baseline halves include the practice gain, so their bias is expected to be positive.")
    add("")

    d = r["dif"]
    add("## Item bias (DIF) check")
    add("")
    add(f"{d['method']} Baseline-burst responses only.")
    add("")
    add("| Family | Planted (grouping) | Found | False flags / unbiased tests | Purification rounds | Met |")
    add("|---|---|---|---|---|---|")
    for fam in ("shopping", "medication"):
        x = d[fam]
        add(f"| {fam} | items {x['planted_items']} ({x['planted_grouping']}) | {x['found']} of {x['planted']} | {x['false_flags']} / {x['tests_unbiased']} ({x['false_flag_rate']:.1%}) | {x.get('purification_rounds', '–')} | {'Yes' if x['pass'] else '**No**'} |")
    add("")
    pre = d.get("preregistered_mh")
    if pre:
        add(f"_{pre['label']}_")
        add("")
        add("| Family | Found | False flags / unbiased tests | Met |")
        add("|---|---|---|---|")
        for fam in ("shopping", "medication"):
            x = pre[fam]
            add(f"| {fam} | {x['found']} of {x['planted']} | {x['false_flags']} / {x['tests_unbiased']} ({x['false_flag_rate']:.1%}) | {'Yes' if x['pass'] else 'No'} |")
        add("")
        add("The pre-registered check matched on a rest score from one session (4–6 items), which cannot separate a real group difference in ability from item bias at this sample size; almost every false flag was in the education grouping, the one with a real ability difference.")
        add("")

    p = r["pathway"]
    add("## Time to assessment (pathway model)")
    add("")
    add(f"_{p['label']}_ Usual care: onset-to-diagnosis delay fitted to the Al Ain study (median 24, mean 34.7 months). Baseline: Review flag, then a median {p['flag_to_review_days_median']:.0f}-day flag-to-review delay; people not flagged follow usual care.")
    add("")
    add("| Pathway | Median months from onset to assessment (IQR) | Assessed within 12 months |")
    add("|---|---|---|")
    add(f"| Usual care (model) | {p['usual_care_months_median']:.1f} ({p['usual_care_months_iqr'][0]:.1f}–{p['usual_care_months_iqr'][1]:.1f}) | {p['assessed_within_12m_usual']:.0%} |")
    add(f"| With Baseline (model) | {p['baseline_months_median']:.1f} ({p['baseline_months_iqr'][0]:.1f}–{p['baseline_months_iqr'][1]:.1f}) | {p['assessed_within_12m_baseline']:.0%} |")
    add("")

    add("## Ablations (each layer removed at v1)")
    add("")
    add("| Model | Sensitivity | Specificity | False / 1,000 py | PPV | Median lead (days) |")
    add("|---|---|---|---|---|---|")
    for x in r["ablations"]:
        add(f"| {x['name']} | {_f(x['sensitivity_12m'])} | {_f(x['specificity_12m'])} | {_f(x['false_reviews_per_1000_py'], 1)} | {_f(x['ppv'])} | {_f(x['lead_days_median'], 0)} |")
    add("")

    lv = r.get("levers")
    if lv:
        add("## Improvement levers (amendment A5, post hoc)")
        add("")
        add("Each lever was added after the first run showed the education gap and the missed slow changers. Each is re-tuned over Watch z "
            "−2.5 to −3.1 and picked by the same rule as v1 (false referrals ≤ 30 per 1,000 person-years first, then the smallest fairness violation). "
            "Same cohort and seed as above, so these numbers share the circularity of v1; the held-out check below is the guard.")
        add("")
        add("| Lever | Chosen Watch z | Sensitivity | False / 1,000 py | Worst sensitivity gap | Worst false-referral ratio | All constraints met |")
        add("|---|---|---|---|---|---|---|")
        for x in lv["levers"]:
            c = x["chosen"]
            add(f"| {x['name']} | {c['watch_z']} | {_f(c['sensitivity_12m'])} | {_f(c['false_reviews_per_1000_py'], 1)} | {_f(c['worst_sensitivity_gap'])} | {_f(c['worst_false_ratio'], 2)} | {'Yes' if c['feasible'] else 'No: ' + ', '.join(c['fails'])} |")
        ad = lv.get("adaptive_difficulty")
        if ad:
            c = ad["chosen"]
            add(f"| Adaptive difficulty (separate cohort, same seed) | {c['watch_z']} | {_f(c['sensitivity_12m'])} | {_f(c['false_reviews_per_1000_py'], 1)} | {_f(c['worst_sensitivity_gap'])} | {_f(c['worst_false_ratio'], 2)} | {'Yes' if c['feasible'] else 'No: ' + ', '.join(c['fails'])} |")
        add("")
        cand = lv["candidate"]
        add(f"Best setting across all levers by the v1 rule: **{cand['lever']}** at Watch z {cand['watch_z']} ({cand['rule']}).")
        add("")
        grid = lv.get("slow_change_grid")
        if grid:
            add("Slow-change rule across settings (Watch z −2.5), next to the plain threshold sweep at a similar false-referral rate:")
            add("")
            add("| CUSUM k | CUSUM h | Sensitivity | False / 1,000 py | Plain threshold with the nearest false rate |")
            add("|---|---|---|---|---|")
            plain = [s for s in r["sweep"] if s["gate"] == "two_stage"]
            for g in grid:
                near = min(plain, key=lambda s: abs(s["false_reviews_per_1000_py"] - g["false_reviews_per_1000_py"]))
                add(f"| {g['cusum_k']} | {g['cusum_h']:g} | {_f(g['sensitivity_12m'])} | {_f(g['false_reviews_per_1000_py'], 1)} | z {near['watch_z']}: sensitivity {_f(near['sensitivity_12m'])} at {_f(near['false_reviews_per_1000_py'], 1)} |")
            add("")
            add("Where the CUSUM's sensitivity matches the plain threshold's at the same false-referral rate, the rule buys nothing that a lower threshold would not.")
            add("")

    ho = r.get("held_out")
    if ho:
        add(f"## Held-out confirmation (new cohort, seed {ho['seed']})")
        add("")
        add("Settings chosen on the main cohort, checked once on a cohort the tuning never saw. This guards against tuning to chance in one cohort. It does **not** guard against wrong generator assumptions; only real data does that.")
        add("")
        add("| Setting | Watch z | Sensitivity | False / 1,000 py | Worst sensitivity gap | Worst false-referral ratio | All constraints met |")
        add("|---|---|---|---|---|---|---|")
        for label, x in ho["settings"].items():
            add(f"| {label} ({x['lever']}) | {x['watch_z']} | {_f(x['sensitivity_12m'])} | {_f(x['false_reviews_per_1000_py'], 1)} | {_f(x['worst_sensitivity_gap'])} | {_f(x['worst_false_ratio'], 2)} | {'Yes' if x['feasible'] else 'No: ' + ', '.join(x['fails'])} |")
        add("")

    add("## Reality anchors")
    add("")
    icc_h = rel["baseline_halves"]["composite"]["icc"]
    icc_b = rel["consecutive_blocks"]["composite"]["icc"]
    comp = r["main"]["completion"]["est"]
    add(f"- **Reliability.** Lab composite ICC {icc_h:.2f} (baseline halves) and {icc_b:.2f} (consecutive blocks). ARC, a smartphone study in an Alzheimer research-centre cohort (n = 290), reported retest ICC above 0.85 for every task and its composite at about 6 months and 1 year [B13]. The simulated values sit in the published range, which says the noise assumptions are not unrealistically optimistic. It does not show the app's own tasks reach it.")
    add(f"- **Completion.** Lab completion {comp:.2f} across all follow-up, including fading and drop-out. ARC reported 80% adherence inside 7-day bursts with research support [B13]; a year-long remote study (n = 33) reported 61% on schedule and 91% cumulative [B14]. Ours is conservative against supported research cohorts, but only measurement settles it: the pilot week (docs/pilot-protocol.md) measures completion, noise and within-week agreement on real people.")
    add("")

    add(f"## Sensitivity analysis ({m['n_sensitivity_cohort']:,} users per scenario, v1 thresholds)")
    add("")
    add("| Scenario | Sensitivity | Specificity | False / 1,000 py | PPV | Median lead (days) | Completion |")
    add("|---|---|---|---|---|---|---|")
    for x in r["sensitivity_analysis"]:
        add(f"| {x['name']} | {_f(x['sensitivity_12m'])} | {_f(x['specificity_12m'])} | {_f(x['false_reviews_per_1000_py'], 1)} | {_f(x['ppv'])} | {_f(x['lead_days_median'], 0)} | {_f(x['completion'], 2)} |")
    add("")

    b = r["burst_arm"]["summary"]
    add("## Burst schedule (secondary arm)")
    add("")
    add(f"5-day bursts every 3 months. Sensitivity {_ci(b['sensitivity_12m'])}, specificity {_ci(b['specificity_12m'])}, false Reviews per 1,000 person-years {_ci(b['false_reviews_per_1000_py'], 1)}, median lead {_ci(b['lead_days_median'], 0)} days, completion {_ci(b['completion'])}.")
    add("")

    fl = r["failures"]
    add("## Failure report")
    add("")
    for key, title in (("missed_decliners", "Missed decliners"), ("detected_decliners", "Detected decliners (for comparison)"), ("false_reviews", "False Reviews")):
        x = fl[key]
        if not x.get("n"):
            add(f"- **{title}:** none.")
            continue
        add(
            f"- **{title}** (n = {x['n']}): trajectory {x['trajectory']}; age {x['age_band']}; familiarity {x['familiarity']}; "
            f"memory-led {x['amnestic_share']:.0%}; mean completion {x['completion_mean']:.0%}; dropped out {x['dropped_out_share']:.0%}."
        )
    add("")
    br = fl.get("sensitivity_by_retention")
    if br:
        add("Sensitivity among decliners who kept using the app versus those who dropped out:")
        add("")
        for var, parts in br.items():
            for part, groups in parts.items():
                add(f"- {var}, {part.replace('_', ' ')}: " + "; ".join(f"{k} {g['sensitivity']:.2f} (n {g['n']})" for k, g in groups.items()))
        add("")
        edu = br.get("education", {})
        gaps = {part: max(g["sensitivity"] for g in groups.values()) - min(g["sensitivity"] for g in groups.values()) for part, groups in edu.items() if len(groups) >= 2}
        if "kept_using" in gaps and "dropped_out" in gaps:
            add(f"Education gap among people who kept using the app: {gaps['kept_using']:.2f}; among those who dropped out: {gaps['dropped_out']:.2f}. "
                "Drop-out caps sensitivity for everyone; a gap among people who kept going comes from measurement, because the generator assumes noisier sessions for low familiarity and low education. That assumption is what the pilot week measures.")
            add("")

    add("## Limits")
    add("")
    add("- Simulated cohort; parameters marked \"assumption\" in `lab/src/baseline_lab/params.yaml` are not from local data.")
    add("- Review is treated as final (first Review only); real clinician review would release false Reviews and allow later detection.")
    add("- The pathway comparison is a model. Usual care is timed from true change onset, which favors usual care.")
    add("- Item parameters are invented; DIF results show the check works, not that the app's items are fair.")
    add("- Circular evidence: thresholds and levers were tuned and tested on the same generator. The held-out seed removes tuning to chance, not wrong assumptions. A local pilot must re-estimate noise, completion and thresholds before any real use.")
    add("- Devices, records and genomics in the app are simulated; the pathway model rests on one hospital's delay data (Al Ain).")
    add("")
    return "\n".join(L)
