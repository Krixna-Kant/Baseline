"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { fmt } from "@/lib/format";
import { ChoiceGroup } from "@/components/ui/Controls";
import type { Est, LabResults } from "./types";

type Var = keyof Dictionary["lab"]["vars"];

function Bar({ label, value, max, ci, tone, text }: { label: string; value: number | null; max: number; ci?: Est; tone: string; text: string }) {
  const w = (v: number) => `${Math.min(100, Math.max(0, (v / max) * 100))}%`;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-base">
        <span>{label}</span>
        <span className="font-semibold" dir="ltr">
          {text}
        </span>
      </div>
      <div className="relative h-4 rounded-full bg-line" dir="ltr">
        {value != null && <div className={`absolute inset-y-0 left-0 rounded-full ${tone}`} style={{ width: w(value) }} />}
        {ci?.lo != null && ci?.hi != null && (
          <div
            className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-ink"
            style={{ left: w(ci.lo), width: `calc(${w(ci.hi)} - ${w(ci.lo)})` }}
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}

export function FairnessPanel({ dict, r }: { dict: Dictionary; r: LabResults }) {
  const t = dict.lab;
  const vars = Object.keys(t.vars) as Var[];
  const [v, setV] = useState<Var>("language");
  const groups = r.segments[v] ?? {};
  const fair = r.fairness[v];
  const maxFalse = Math.max(40, ...Object.values(groups).map((g) => g.false_reviews_per_1000_py.hi ?? g.false_reviews_per_1000_py.est ?? 0));

  return (
    <div className="flex flex-col gap-5">
      <p className="text-lg text-muted">{t.fairnessBody}</p>
      <ChoiceGroup<Var> label={t.groupBy} columns={3} value={v} onChange={setV} options={vars.map((k) => ({ value: k, label: t.vars[k] }))} />
      {fair && (
        <p
          className={`rounded-2xl p-3 text-base font-semibold ${fair.sensitivity_gap <= 0.1 && fair.false_ratio <= 1.5 ? "bg-stable-soft text-stable" : "bg-watch-soft text-watch"}`}
          dir="ltr"
        >
          {fmt(t.gap, { v: fair.sensitivity_gap.toFixed(2), r: fair.false_ratio.toFixed(2) })}
        </p>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold">{t.sensitivity}</h4>
          {Object.entries(groups).map(([g, s]) => (
            <Bar
              key={g}
              label={`${g}${s.low_n || s.low_n_decliners ? ` (${t.lowN})` : ""}`}
              value={s.sensitivity_12m.est}
              ci={s.sensitivity_12m}
              max={1}
              tone="bg-brand"
              text={s.sensitivity_12m.est == null ? "—" : `${Math.round(s.sensitivity_12m.est * 100)}%`}
            />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold">{t.falsePer1000}</h4>
          {Object.entries(groups).map(([g, s]) => (
            <Bar
              key={g}
              label={`${g}${s.low_n ? ` (${t.lowN})` : ""}`}
              value={s.false_reviews_per_1000_py.est}
              ci={s.false_reviews_per_1000_py}
              max={maxFalse}
              tone="bg-review"
              text={s.false_reviews_per_1000_py.est?.toFixed(1) ?? "—"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
