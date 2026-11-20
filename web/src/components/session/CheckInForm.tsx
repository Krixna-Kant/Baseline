"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { fmt } from "@/lib/format";
import { getState, update } from "@/lib/store";
import type { CheckIn } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Scale5, YesNo } from "@/components/ui/Controls";

type Draft = { [K in keyof CheckIn]: CheckIn[K] | null };

const EMPTY: Draft = {
  sleepHours: 7,
  sleepQuality: null,
  mood: null,
  stress: null,
  ill: null,
  hearingOk: null,
  visionOk: null,
  loneliness: null,
  fasting: null,
  newMedication: null,
  caffeine: null,
  redFlag: null,
};

export function CheckInForm({ dict, onDone }: { dict: Dictionary; onDone: (c: CheckIn) => void }) {
  const t = dict.checkin;
  const c = dict.common;
  const [d, setD] = useState<Draft>(() => ({ ...EMPTY, ...getState().draftCheckIn }));
  const set = <K extends keyof CheckIn>(k: K) => (v: CheckIn[K]) => setD((prev) => ({ ...prev, [k]: v }));
  const complete = Object.values(d).every((v) => v !== null);

  const yn = (k: "ill" | "hearingOk" | "visionOk" | "fasting" | "newMedication" | "caffeine" | "redFlag", label: string) => (
    <YesNo label={label} value={d[k]} onChange={set(k)} yes={c.yes} no={c.no} />
  );

  return (
    <section className="flex flex-col gap-7">
      <div>
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="text-lg text-muted">{t.intro}</p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xl font-semibold">{t.sleepHours}</p>
        <div className="flex items-center gap-4">
          <Button variant="secondary" aria-label="-" onClick={() => setD((p) => ({ ...p, sleepHours: Math.max(0, (p.sleepHours ?? 7) - 0.5) }))}>
            −
          </Button>
          <span className="flex-1 text-center text-2xl font-bold" aria-live="polite">
            {fmt(t.hours, { n: d.sleepHours ?? 0 })}
          </span>
          <Button variant="secondary" aria-label="+" onClick={() => setD((p) => ({ ...p, sleepHours: Math.min(14, (p.sleepHours ?? 7) + 0.5) }))}>
            +
          </Button>
        </div>
      </div>

      <Scale5 label={t.sleepQuality} low={t.qualityLow} high={t.qualityHigh} value={d.sleepQuality} onChange={set("sleepQuality")} />
      <Scale5 label={t.mood} low={t.moodLow} high={t.moodHigh} value={d.mood} onChange={set("mood")} />
      <Scale5 label={t.stress} low={t.scaleLow} high={t.scaleHigh} value={d.stress} onChange={set("stress")} />
      <Scale5 label={t.loneliness} low={t.scaleLow} high={t.scaleHigh} value={d.loneliness} onChange={set("loneliness")} />
      {yn("ill", t.ill)}
      {yn("hearingOk", t.hearingOk)}
      {yn("visionOk", t.visionOk)}
      {yn("fasting", t.fasting)}
      {yn("newMedication", t.newMedication)}
      {yn("caffeine", t.caffeine)}
      <div className="rounded-2xl border-2 border-urgent/30 p-4">{yn("redFlag", t.redFlag)}</div>

      <Button
        disabled={!complete}
        onClick={() => {
          update((s) => ({ ...s, draftCheckIn: null }));
          onDone(d as CheckIn);
        }}
      >
        {c.continue}
      </Button>
    </section>
  );
}
