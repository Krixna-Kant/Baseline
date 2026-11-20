"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Item } from "@/lib/content";
import { fmt } from "@/lib/format";
import { mulberry32, shuffle } from "@/lib/random";
import type { RawEvent, TaskResult } from "@/lib/types";
import { nowMs } from "@/lib/clock";
import { Button } from "@/components/ui/Button";
import { TaskIntro } from "./TaskIntro";

export interface ShoppingForm {
  formId: string;
  seed: number;
  targets: Item[];
  foils: Item[];
  studySeconds: number;
}

type Stage = "intro" | "study" | "recall";

export function ShoppingTask({
  dict,
  lang,
  form,
  phase,
  practice,
  onDone,
}: {
  dict: Dictionary;
  lang: "ar" | "en";
  form: ShoppingForm;
  phase: "immediate" | "delayed";
  practice: boolean;
  onDone: (result: TaskResult) => void;
}) {
  const t = dict.tasks.shopping;
  const [stage, setStage] = useState<Stage>("intro");
  const [secondsLeft, setSecondsLeft] = useState(form.studySeconds);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const events = useRef<RawEvent[]>([]);
  const t0 = useRef(0);
  const startedAt = useRef(new Date().toISOString());

  const grid = useMemo(
    () => shuffle([...form.targets, ...form.foils], mulberry32(form.seed + (phase === "delayed" ? 7 : 3))),
    [form, phase],
  );

  const log = (type: string, data?: Record<string, unknown>) =>
    events.current.push({ t: Math.round(nowMs() - t0.current), type, data });

  useEffect(() => {
    if (stage !== "study") return;
    const id = setTimeout(() => {
      if (secondsLeft > 1) {
        setSecondsLeft(secondsLeft - 1);
        return;
      }
      events.current.push({ t: Math.round(nowMs() - t0.current), type: "study_end" });
      setStage("recall");
    }, 1000);
    return () => clearTimeout(id);
  }, [stage, secondsLeft]);

  function begin() {
    t0.current = nowMs();
    startedAt.current = new Date().toISOString();
    if (phase === "immediate") {
      log("study_start", { targets: form.targets.map((i) => i.id) });
      setStage("study");
    } else {
      log("recall_start");
      setStage("recall");
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      log(next.has(id) ? "select" : "deselect", { id });
      return next;
    });
  }

  function finish() {
    log("recall_end");
    const targetIds = new Set(form.targets.map((i) => i.id));
    const hits = [...selected].filter((id) => targetIds.has(id)).length;
    const falseAlarms = selected.size - hits;
    const hitRate = hits / form.targets.length;
    const faRate = falseAlarms / form.foils.length;
    const recallStart = events.current.find((e) => e.type === "recall_start" || e.type === "study_end")?.t ?? 0;
    onDone({
      family: "shopping",
      phase,
      formId: form.formId,
      practice,
      startedAt: startedAt.current,
      endedAt: new Date().toISOString(),
      events: events.current,
      metrics: {
        hits,
        falseAlarms,
        nTargets: form.targets.length,
        nFoils: form.foils.length,
        hitRate,
        faRate,
        discrimination: hitRate - faRate,
        recallTimeMs: Math.round(nowMs() - t0.current - recallStart),
      },
      validity: selected.size === 0 ? ["no_response"] : [],
    });
  }

  const name = (i: Item) => i[lang];

  if (stage === "intro") {
    return (
      <TaskIntro
        title={t.name}
        body={phase === "immediate" ? t.intro : t.delayedIntro}
        lang={lang}
        listen={dict.common.listen}
        stop={dict.common.stop}
        practiceBadge={practice ? dict.tasks.practiceBadge : undefined}
        startLabel={dict.tasks.ready}
        onStart={begin}
      />
    );
  }

  if (stage === "study") {
    return (
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t.studyTitle}</h1>
          <span className="grid size-14 place-items-center rounded-full bg-brand-soft text-xl font-bold text-brand" aria-live="polite">
            {secondsLeft}
          </span>
        </div>
        <ul className="grid grid-cols-2 gap-3 rounded-[var(--radius-card)] border-2 border-dashed border-line bg-card p-4">
          {form.targets.map((i) => (
            <li key={i.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3 text-xl font-semibold">
              <span aria-hidden className="text-4xl">
                {i.emoji}
              </span>
              {name(i)}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t.recallTitle}</h1>
      <p className="text-lg text-muted">{t.recallBody}</p>
      <div className="grid grid-cols-3 gap-3">
        {grid.map((i) => (
          <button
            key={i.id}
            type="button"
            aria-pressed={selected.has(i.id)}
            onClick={() => toggle(i.id)}
            className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-line bg-card p-2 text-base font-semibold aria-pressed:border-brand aria-pressed:bg-brand-soft"
          >
            <span aria-hidden className="text-4xl">
              {i.emoji}
            </span>
            {name(i)}
          </button>
        ))}
      </div>
      <p className="text-center text-muted" aria-live="polite">
        {fmt(t.selected, { n: selected.size })}
      </p>
      <Button onClick={finish}>{dict.common.done}</Button>
    </section>
  );
}
