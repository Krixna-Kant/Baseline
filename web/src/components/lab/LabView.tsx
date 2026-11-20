"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { fmt } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { SimulatedBadge } from "@/components/ui/SimulatedBadge";
import { FairnessPanel } from "./FairnessPanel";
import { ThresholdExplorer } from "./ThresholdExplorer";
import { Timelapse } from "./Timelapse";
import type { DifFamily, LabResults, ModelRow, Profile } from "./types";

const pct = (x: number | null | undefined, d = 0) => (x == null ? "—" : `${(x * 100).toFixed(d)}%`);
const num = (x: number | null | undefined, d = 1) => (x == null ? "—" : x.toFixed(d));

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      {children}
    </Card>
  );
}

function ModelTable({ rows, first, dict }: { rows: ModelRow[]; first: string; dict: Dictionary }) {
  const t = dict.lab;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-start text-base" dir="ltr">
        <thead className="text-sm text-muted">
          <tr className="border-b border-line">
            <th className="py-2 pe-3 text-start font-semibold">{first}</th>
            <th className="px-2 text-end font-semibold">{t.sensitivity}</th>
            <th className="px-2 text-end font-semibold">{t.specificity}</th>
            <th className="px-2 text-end font-semibold">{t.falsePer1000}</th>
            <th className="ps-2 text-end font-semibold">{t.lead}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x, i) => (
            <tr key={x.name} className={`border-b border-line ${i === 0 ? "font-semibold" : ""}`}>
              <td className="py-2 pe-3">{x.name}</td>
              <td className="px-2 text-end">{pct(x.sensitivity_12m)}</td>
              <td className="px-2 text-end">{pct(x.specificity_12m, 1)}</td>
              <td className="px-2 text-end">{num(x.false_reviews_per_1000_py)}</td>
              <td className="ps-2 text-end">{num(x.lead_days_median, 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DifRow({ name, d, dict }: { name: string; d: DifFamily; dict: Dictionary }) {
  const t = dict.lab;
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-3">
      <p className="font-semibold">{name}</p>
      <p>{fmt(t.found, { n: d.found, of: d.planted })}</p>
      <p className={d.false_flag_rate > 0.05 ? "text-watch" : "text-muted"}>
        {fmt(t.falseFlags, { n: d.false_flags, p: pct(d.false_flag_rate, 1) })}
      </p>
    </div>
  );
}

function share(rec?: Record<string, number>) {
  if (!rec) return "";
  return Object.entries(rec)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, v]) => `${k} ${pct(v)}`)
    .join(", ");
}

function ProfileLine({ title, p }: { title: string; p: Profile }) {
  return (
    <li className="flex flex-col gap-1">
      <span className="font-semibold">
        {title} (n = {p.n})
      </span>
      {p.n > 0 && (
        <span className="text-base text-muted" dir="ltr">
          {share(p.trajectory)} · {share(p.familiarity)} · completion {pct(p.completion_mean)} · dropped out {pct(p.dropped_out_share)}
        </span>
      )}
    </li>
  );
}

export function LabView({ dict }: { dict: Dictionary }) {
  const t = dict.lab;
  const [r, setR] = useState<LabResults | null | "missing">(null);

  useEffect(() => {
    fetch("/lab/results.json", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : "missing"))
      .then(setR)
      .catch(() => setR("missing"));
  }, []);

  if (r === null) return <p className="text-lg text-muted">{t.loading}</p>;
  if (r === "missing") return <p className="text-lg">{t.missing}</p>;

  const m = r.meta;
  const rel = r.reliability;
  const p = r.pathway;
  const tlUsers = r.timelapse.map((u) => ({ ...u, label: (dict.lab as Record<string, unknown>)[`tl_${u.key}`] as string ?? u.label }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-start">
          <SimulatedBadge label={dict.common.simulated} hint={dict.common.simulatedHint} />
        </div>
        <h1 className="text-4xl font-bold">{t.title}</h1>
        <p className="text-lg">{t.intro}</p>
        <p className="rounded-2xl bg-simulated-soft p-4 font-semibold text-simulated">{t.label}</p>
        {m.fast_mode && <p className="rounded-2xl bg-urgent-soft p-4 font-semibold text-urgent">{t.fastMode}</p>}
        <p className="text-base text-muted" dir="ltr">
          {fmt(t.setup, { users: m.n_users.toLocaleString("en"), seed: m.seed, protocol: m.protocol_version, amendments: m.amendments.join(", ") })}
        </p>
      </header>

      <Section title={t.criteriaTitle}>
        <ul className="flex flex-col gap-3">
          {r.criteria.map((c) => (
            <li key={c.name} className="flex items-start justify-between gap-4 border-b border-line pb-3 last:border-0">
              <div className="flex flex-col">
                <span className="text-lg font-semibold">{c.name}</span>
                <span className="text-base text-muted" dir="ltr">
                  {c.target} → {c.value}
                </span>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${c.pass ? "bg-stable-soft text-stable" : "bg-watch-soft text-watch"}`}>
                {c.pass ? t.met : t.notMet}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t.explorerTitle}>
        <ThresholdExplorer dict={dict} r={r} />
      </Section>

      <Section title={t.fairnessTitle}>
        <FairnessPanel dict={dict} r={r} />
      </Section>

      <Section title={t.timelapseTitle}>
        <Timelapse dict={dict} users={tlUsers} />
      </Section>

      <Section title={t.pathwayTitle}>
        <p className="text-base text-muted">{t.pathwayBody}</p>
        {(
          [
            [t.usualCare, p.usual_care_months_median, p.assessed_within_12m_usual, "bg-muted"],
            [t.withBaseline, p.baseline_months_median, p.assessed_within_12m_baseline, "bg-brand"],
          ] as const
        ).map(([label, months, within, tone]) => (
          <div key={label} className="flex flex-col gap-1">
            <div className="flex justify-between text-lg">
              <span className="font-semibold">{label}</span>
              <span>{fmt(t.months, { n: months.toFixed(1) })}</span>
            </div>
            <div className="h-5 rounded-full bg-line" dir="ltr">
              <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, (months / Math.max(p.usual_care_months_median, 1)) * 100)}%` }} />
            </div>
            <span className="text-base text-muted">{fmt(t.within12, { p: pct(within) })}</span>
          </div>
        ))}
      </Section>

      <Section title={t.reliabilityTitle}>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              [t.halves, rel.baseline_halves.composite],
              [t.blocks, rel.consecutive_blocks.composite],
            ] as const
          ).map(([label, x]) => (
            <div key={label} className="rounded-2xl border border-line bg-surface p-3">
              <p className="text-sm text-muted">{label}</p>
              <p className="text-2xl font-bold" dir="ltr">
                {x.icc.toFixed(2)}
              </p>
              <p className="text-sm text-muted" dir="ltr">
                {x.lo.toFixed(2)}–{x.hi.toFixed(2)} · n {x.n.toLocaleString("en")}
              </p>
            </div>
          ))}
        </div>
        <p className="text-base text-muted">{t.iccNote}</p>
      </Section>

      <Section title={t.difTitle}>
        <p className="text-base text-muted">{t.difBody}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <DifRow name={dict.tasks.shopping.name} d={r.dif.shopping} dict={dict} />
          <DifRow name={dict.tasks.medication.name} d={r.dif.medication} dict={dict} />
        </div>
        {r.dif.exploratory_purified && (
          <>
            <p className="text-sm font-semibold text-muted">{t.exploratory}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <DifRow name={dict.tasks.shopping.name} d={r.dif.exploratory_purified.shopping} dict={dict} />
              <DifRow name={dict.tasks.medication.name} d={r.dif.exploratory_purified.medication} dict={dict} />
            </div>
          </>
        )}
      </Section>

      <Section title={t.ablationTitle}>
        <ModelTable rows={r.ablations} first="" dict={dict} />
      </Section>

      <Section title={t.sensitivityTitle}>
        <ModelTable rows={r.sensitivity_analysis} first={t.scenario} dict={dict} />
      </Section>

      <Section title={t.failuresTitle}>
        <ul className="flex flex-col gap-3">
          <ProfileLine title={t.missed} p={r.failures.missed_decliners} />
          <ProfileLine title={t.falseReviews} p={r.failures.false_reviews} />
        </ul>
      </Section>

      <Card className="flex flex-col gap-3 border-2 border-brand">
        <h2 className="text-2xl font-bold">{t.pilotTitle}</h2>
        <p className="text-lg">{t.pilotBody}</p>
      </Card>

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">{t.downloads}</h2>
        <a className="text-lg font-semibold text-brand underline" href="/lab/validation-report.md" download>
          {t.reportLink}
        </a>
        <a className="text-lg font-semibold text-brand underline" href="/lab/results.json" download>
          {t.jsonLink}
        </a>
      </div>
    </div>
  );
}
