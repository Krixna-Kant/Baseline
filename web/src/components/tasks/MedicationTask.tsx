"use client";

import { useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { SLOTS, type Instruction, type Medicine, type Slot } from "@/lib/content";
import type { RawEvent, TaskResult } from "@/lib/types";
import { nowMs } from "@/lib/clock";
import { Button } from "@/components/ui/Button";
import { TaskIntro } from "./TaskIntro";

export interface MedicationForm {
  formId: string;
  rows: { medicine: Medicine; instruction: Instruction }[];
}

export function MedicationTask({
  dict,
  lang,
  form,
  practice,
  onDone,
}: {
  dict: Dictionary;
  lang: "ar" | "en";
  form: MedicationForm;
  practice: boolean;
  onDone: (result: TaskResult) => void;
}) {
  const t = dict.tasks.medication;
  const [started, setStarted] = useState(false);
  const [grid, setGrid] = useState<Record<string, Set<Slot>>>(() =>
    Object.fromEntries(form.rows.map((r) => [r.medicine.id, new Set<Slot>()])),
  );
  const events = useRef<RawEvent[]>([]);
  const t0 = useRef(0);
  const startedAt = useRef("");
  const changes = useRef(0);

  function toggle(med: string, slot: Slot) {
    changes.current += 1;
    setGrid((prev) => {
      const next = new Set(prev[med]);
      if (next.has(slot)) next.delete(slot);
      else next.add(slot);
      events.current.push({
        t: Math.round(nowMs() - t0.current),
        type: next.has(slot) ? "place" : "remove",
        data: { med, slot },
      });
      return { ...prev, [med]: next };
    });
  }

  function finish() {
    let omissions = 0;
    let commissions = 0;
    let perfect = 0;
    for (const { medicine, instruction } of form.rows) {
      const placed = grid[medicine.id];
      const want = new Set(instruction.slots);
      const om = instruction.slots.filter((s) => !placed.has(s)).length;
      const co = [...placed].filter((s) => !want.has(s)).length;
      omissions += om;
      commissions += co;
      if (om + co === 0) perfect += 1;
    }
    const cells = form.rows.length * SLOTS.length;
    onDone({
      family: "medication",
      formId: form.formId,
      practice,
      startedAt: startedAt.current,
      endedAt: new Date().toISOString(),
      events: events.current,
      metrics: {
        cellAccuracy: (cells - omissions - commissions) / cells,
        omissions,
        commissions,
        perfectRows: perfect,
        nRows: form.rows.length,
        changes: changes.current,
        timeMs: Math.round(nowMs() - t0.current),
      },
      validity: changes.current === 0 ? ["no_response"] : [],
    });
  }

  if (!started) {
    return (
      <TaskIntro
        title={t.name}
        body={t.intro}
        lang={lang}
        listen={dict.common.listen}
        stop={dict.common.stop}
        practiceBadge={practice ? dict.tasks.practiceBadge : undefined}
        startLabel={dict.tasks.start}
        onStart={() => {
          t0.current = nowMs();
          startedAt.current = new Date().toISOString();
          setStarted(true);
        }}
      />
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t.name}</h1>
      <ul className="flex flex-col gap-4">
        {form.rows.map(({ medicine, instruction }) => (
          <li key={medicine.id} className="flex flex-col gap-3 rounded-[var(--radius-card)] border-2 border-line bg-card p-4">
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-6 w-10 shrink-0 rounded-full" style={{ background: medicine.color }} />
              <div>
                <p className="text-lg font-semibold">{medicine[lang]}</p>
                <p className="text-lg">{instruction[lang]}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SLOTS.map((slot) => {
                const on = grid[medicine.id].has(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    aria-pressed={on}
                    aria-label={`${medicine[lang]}: ${t.slots[slot]}`}
                    onClick={() => toggle(medicine.id, slot)}
                    className="flex min-h-16 flex-col items-center justify-center rounded-2xl border-2 border-line bg-surface text-base font-semibold aria-pressed:border-brand aria-pressed:bg-brand-soft"
                  >
                    <span aria-hidden className="h-4 w-7 rounded-full" style={{ background: on ? medicine.color : "transparent" }} />
                    {t.slots[slot]}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
      <Button onClick={finish}>{dict.common.done}</Button>
    </section>
  );
}
