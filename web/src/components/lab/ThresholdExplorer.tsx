"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { fmt } from "@/lib/format";
import { ChoiceGroup } from "@/components/ui/Controls";
import type { LabResults, SweepRow } from "./types";

const FALSE_LIMIT = 30;

function pct(x: number | null | undefined) {
  return x == null ? "—" : `${Math.round(x * 100)}%`;
}

export function ThresholdExplorer({ dict, r }: { dict: Dictionary; r: LabResults }) {
  const t = dict.lab;
  const zs = [...new Set(r.sweep.map((s) => s.watch_z))].sort((a, b) => b - a);
  const [gate, setGate] = useState<SweepRow["gate"]>(r.v1.gate);
  const [zi, setZi] = useState(Math.max(0, zs.indexOf(r.v1.watch_z)));
  const row = r.sweep.find((s) => s.gate === gate && s.watch_z === zs[zi]);
  const isV1 = row && row.watch_z === r.v1.watch_z && row.gate === r.v1.gate;

  const W = 560;
  const H = 260;
  const pad = 40;
  const maxX = Math.max(FALSE_LIMIT * 1.5, ...r.sweep.map((s) => s.false_reviews_per_1000_py));
  const x = (v: number) => pad + (v / maxX) * (W - pad - 12);
  const y = (v: number) => H - pad - v * (H - pad - 12);
  const line = (g: SweepRow["gate"]) =>
    r.sweep
      .filter((s) => s.gate === g)
      .sort((a, b) => a.false_reviews_per_1000_py - b.false_reviews_per_1000_py)
      .map((s) => `${x(s.false_reviews_per_1000_py)},${y(s.sensitivity_12m)}`)
      .join(" ");

  return (
    <div className="flex flex-col gap-5">
      <p className="text-lg text-muted">{t.explorerBody}</p>
      <ChoiceGroup<SweepRow["gate"]>
        label={t.gate}
        columns={2}
        value={gate}
        onChange={setGate}
        options={[
          { value: "two_stage", label: t.twoStage },
          { value: "one_stage", label: t.oneStage },
        ]}
      />
      <label className="flex flex-col gap-2">
        <span className="text-lg font-semibold">
          {t.watchZ}: <span dir="ltr">{zs[zi]?.toFixed(1)}</span>
        </span>
        <input
          type="range"
          min={0}
          max={zs.length - 1}
          step={1}
          value={zi}
          onChange={(e) => setZi(Number(e.target.value))}
          className="h-10 w-full accent-[var(--color-brand)]"
          dir="ltr"
        />
      </label>

      {row && (
        <>
          <p className={`rounded-2xl p-3 text-base font-semibold ${row.feasible ? "bg-stable-soft text-stable" : "bg-watch-soft text-watch"}`}>
            {isV1 && <span className="me-2">★ {t.chosen} ·</span>}
            {row.feasible ? t.meetsAll : fmt(t.fails, { list: row.fails.join(", ") })}
          </p>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(
              [
                [t.sensitivity, pct(row.sensitivity_12m)],
                [t.specificity, pct(row.specificity_12m)],
                [t.falsePer1000, row.false_reviews_per_1000_py.toFixed(1)],
                [t.ppv, pct(row.ppv)],
                [t.lead, row.lead_days_median == null ? "—" : Math.round(row.lead_days_median).toString()],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-line bg-surface p-3">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="text-2xl font-bold" dir="ltr">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full [direction:ltr]" role="img" aria-label={`${t.chartY} / ${t.chartX}`}>
        <rect x={x(0)} y={12} width={x(FALSE_LIMIT) - x(0)} height={H - pad - 12} className="fill-stable-soft" />
        <line x1={x(FALSE_LIMIT)} x2={x(FALSE_LIMIT)} y1={12} y2={H - pad} className="stroke-stable" strokeDasharray="4 4" />
        <text x={x(FALSE_LIMIT) + 4} y={24} className="fill-stable text-[11px]">
          {t.limit} {FALSE_LIMIT}
        </text>
        <line x1={pad} x2={W - 12} y1={H - pad} y2={H - pad} className="stroke-line" />
        <line x1={pad} x2={pad} y1={12} y2={H - pad} className="stroke-line" />
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <text key={v} x={pad - 6} y={y(v) + 4} textAnchor="end" className="fill-muted text-[11px]">
            {v * 100}%
          </text>
        ))}
        {[0, Math.round(maxX / 2), Math.round(maxX)].map((v) => (
          <text key={v} x={x(v)} y={H - pad + 16} textAnchor="middle" className="fill-muted text-[11px]">
            {v}
          </text>
        ))}
        <text x={(W + pad) / 2} y={H - 6} textAnchor="middle" className="fill-muted text-[12px]">
          {t.chartX}
        </text>
        <polyline points={line("one_stage")} fill="none" className="stroke-muted" strokeWidth={2} strokeDasharray="5 4" />
        <polyline points={line("two_stage")} fill="none" className="stroke-brand" strokeWidth={2.5} />
        {row && (
          <circle cx={x(row.false_reviews_per_1000_py)} cy={y(row.sensitivity_12m)} r={7} className="fill-brand stroke-card" strokeWidth={2} />
        )}
      </svg>
    </div>
  );
}
